// src/features/missions/Math Exercises/components/MathExercisesMission.tsx
import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';

import {
  Difficulty,
  OperationType,
} from '../types/mathExercises.types';
import { DIFFICULTY_STYLES } from '../constants/mathExercises.config';
import { useMathExercises } from '../hooks/useMathExercises';
import { useCurrentTime } from '../hooks/useCurrentTime';

import { useAuth } from '../../../auth/hooks/useAuth';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';
import { MissionCompleteModal } from '../../../../shared/components/missions/MissionCompleteModal';
import { MissionErrorCounter } from '../../../../shared/components/missions/MissionErrorCounter';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
  operationType?: OperationType;
}

const DIFFICULTY_ORDER: Difficulty[] = [
  'easy',
  'medium',
  'hard',
];

const MAX_ERRORS = 3;

function getPreviousDifficulty(
  difficulty: Difficulty,
): Difficulty | null {
  const currentIndex =
    DIFFICULTY_ORDER.indexOf(difficulty);

  if (currentIndex <= 0) {
    return null;
  }

  return DIFFICULTY_ORDER[currentIndex - 1];
}

function getDifficultyLabel(
  difficulty: Difficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish
      ? 'fácil'
      : 'easy';
  }

  if (difficulty === 'medium') {
    return isSpanish
      ? 'normal'
      : 'normal';
  }

  return isSpanish
    ? 'difícil'
    : 'hard';
}

function getDifficultyPillLabel(
  difficulty: Difficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish
      ? 'FÁCIL'
      : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish
      ? 'NORMAL'
      : 'NORMAL';
  }

  return isSpanish
    ? 'DIFÍCIL'
    : 'HARD';
}

function translateDay(
  day: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return day;
  }

  const normalized = day
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('lunes')) {
    return 'Monday';
  }

  if (normalized.includes('martes')) {
    return 'Tuesday';
  }

  if (normalized.includes('miercoles')) {
    return 'Wednesday';
  }

  if (normalized.includes('jueves')) {
    return 'Thursday';
  }

  if (normalized.includes('viernes')) {
    return 'Friday';
  }

  if (normalized.includes('sabado')) {
    return 'Saturday';
  }

  if (normalized.includes('domingo')) {
    return 'Sunday';
  }

  return day;
}

export function MathExercisesMission({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
  operationType,
}: Props) {
  const {
    width,
  } = useWindowDimensions();

  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish =
    language === 'es';

  const {
    user,
    isAuthenticated,
    isGuest,
  } = useAuth();

  const [
    missionCount,
    setMissionCount,
  ] = React.useState(0);

  const [
    difficulty,
    setDifficulty,
  ] = React.useState<Difficulty>(
    initialDifficulty,
  );

  const [
    errorCount,
    setErrorCount,
  ] = React.useState(0);

  const [
    feedbackMessage,
    setFeedbackMessage,
  ] = React.useState('');

  const [
    feedbackType,
    setFeedbackType,
  ] = React.useState<
    'error' | 'warning' | 'success'
  >('error');

  const [
    missionCompleted,
    setMissionCompleted,
  ] = React.useState(false);

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];

  const totalQuantity =
    Math.max(
      1,
      quantity,
    );

  const {
    state,
    current,
    handleInputChange,
    handleConfirm,
    handleReplace,
  } = useMathExercises(
    difficulty,
    1,
    operationType,
  );

  const {
    time,
    day,
  } = useCurrentTime();

  const getExpression =
    React.useCallback(() => {
      const exercise =
        current as any;

      if (!exercise) {
        return '';
      }

      if (exercise.expression) {
        return String(exercise.expression);
      }

      return `${exercise.num1 ?? ''} ${
        exercise.operation ?? ''
      } ${exercise.num2 ?? ''}`.trim();
    }, [
      current,
    ]);

  const getCorrectAnswer =
    React.useCallback(() => {
      const exercise =
        current as any;

      if (!exercise) {
        return '';
      }

      const storedAnswer =
        exercise.answer ??
        exercise.result ??
        exercise.correctAnswer ??
        exercise.correct_answer;

      if (
        storedAnswer !== undefined &&
        storedAnswer !== null
      ) {
        return String(storedAnswer);
      }

      const num1 =
        Number(exercise.num1);

      const num2 =
        Number(exercise.num2);

      const operation =
        String(exercise.operation ?? '');

      const type =
        String(
          operationType ??
            exercise.operationType ??
            '',
        );

      if (
        Number.isNaN(num1) ||
        Number.isNaN(num2)
      ) {
        return '';
      }

      if (
        type === 'addition' ||
        operation === '+'
      ) {
        return String(num1 + num2);
      }

      if (
        type === 'subtraction' ||
        operation === '-'
      ) {
        return String(num1 - num2);
      }

      if (
        type === 'multiplication' ||
        operation === 'x' ||
        operation === '×' ||
        operation === '*'
      ) {
        return String(num1 * num2);
      }

      if (
        type === 'division' ||
        operation === '/' ||
        operation === '÷'
      ) {
        return String(
          num2 === 0
            ? ''
            : num1 / num2,
        );
      }

      return '';
    }, [
      current,
      operationType,
    ]);

  const saveMissionHistory =
    React.useCallback(
      (
        success: boolean,
        nextErrorCount: number,
      ) => {
        if (
          !isAuthenticated ||
          isGuest ||
          !user?.id ||
          !current
        ) {
          return;
        }

        const exercise =
          current as any;

        MissionHistoryLocalService.save({
          userId: user.id,
          missionType: 'math_exercises',
          difficulty,
          content: {
            expression: getExpression(),
            num1: exercise.num1,
            num2: exercise.num2,
            operation: exercise.operation,
            operationType,
          },
          correctAnswer: getCorrectAnswer(),
          userAnswer: state.userInput,
          success,
          errorCount: nextErrorCount,
          durationSeconds: null,
        });

        void syncMissionHistory(user.id);
      },
      [
        isAuthenticated,
        isGuest,
        user?.id,
        current,
        difficulty,
        operationType,
        state.userInput,
        getExpression,
        getCorrectAnswer,
      ],
    );

  const prevHasError =
    React.useRef(false);

  React.useEffect(() => {
    if (
      state.hasError &&
      !prevHasError.current
    ) {
      const nextErrorCount =
        errorCount + 1;

      const previousDifficulty =
        getPreviousDifficulty(difficulty);

      saveMissionHistory(
        false,
        nextErrorCount,
      );

      if (
        nextErrorCount >= MAX_ERRORS &&
        previousDifficulty
      ) {
        setDifficulty(previousDifficulty);
        setErrorCount(0);
        setFeedbackType('warning');

        setFeedbackMessage(
          isSpanish
            ? `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(
                previousDifficulty,
                true,
              )}.`
            : `You failed 3 times. You dropped to ${getDifficultyLabel(
                previousDifficulty,
                false,
              )}.`,
        );

        handleReplace();

        prevHasError.current =
          state.hasError;

        return;
      }

      if (
        nextErrorCount >= MAX_ERRORS &&
        !previousDifficulty
      ) {
        setErrorCount(0);
        setFeedbackType('error');

        setFeedbackMessage(
          isSpanish
            ? 'Fallaste 3 veces, pero ya estás en el nivel más bajo. Intenta nuevamente.'
            : 'You failed 3 times, but you are already at the lowest level. Try again.',
        );

        handleReplace();

        prevHasError.current =
          state.hasError;

        return;
      }

      setErrorCount(nextErrorCount);

      if (
        nextErrorCount === MAX_ERRORS - 1 &&
        previousDifficulty
      ) {
        setFeedbackType('warning');

        setFeedbackMessage(
          isSpanish
            ? `1 fallo más y bajas a ${getDifficultyLabel(
                previousDifficulty,
                true,
              )}.`
            : `1 more mistake and you drop to ${getDifficultyLabel(
                previousDifficulty,
                false,
              )}.`,
        );
      } else {
        const remainingErrors =
          MAX_ERRORS - nextErrorCount;

        setFeedbackType('error');

        setFeedbackMessage(
          isSpanish
            ? `Respuesta incorrecta. Te quedan ${remainingErrors} intento${
                remainingErrors === 1
                  ? ''
                  : 's'
              }.`
            : `Incorrect answer. You have ${remainingErrors} attempt${
                remainingErrors === 1
                  ? ''
                  : 's'
              } left.`,
        );
      }
    }

    prevHasError.current =
      state.hasError;
  }, [
    state.hasError,
    errorCount,
    difficulty,
    handleReplace,
    saveMissionHistory,
    isSpanish,
  ]);

  React.useEffect(() => {
    setErrorCount(0);
  }, [
    current?.expression,
  ]);

  const prevCompleted =
    React.useRef(false);

  React.useEffect(() => {
    if (
      state.isCompleted &&
      !prevCompleted.current
    ) {
      const next =
        missionCount + 1;

      saveMissionHistory(
        true,
        errorCount,
      );

      setFeedbackType('success');

      setFeedbackMessage(
        isSpanish
          ? 'Correcto.'
          : 'Correct.',
      );

      if (next >= totalQuantity) {
        setMissionCompleted(true);
      } else {
        setMissionCount(next);

        setTimeout(() => {
          setFeedbackMessage('');
          handleReplace();
        }, 500);
      }
    }

    prevCompleted.current =
      state.isCompleted;
  }, [
    state.isCompleted,
    missionCount,
    totalQuantity,
    errorCount,
    saveMissionHistory,
    onComplete,
    handleReplace,
    isSpanish,
  ]);

  const displayExpression =
    getExpression() || '...';

  const feedbackColor =
    feedbackType === 'success'
      ? colors.success
      : feedbackType === 'warning'
        ? difficultyStyle.accentColor
        : colors.danger;

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <View
          style={[
            styles.screen,
            {
              backgroundColor: colors.bg,
            },
          ]}
        >
          <View
            style={[
              styles.pill,
              {
                backgroundColor:
                  difficultyStyle.bgColor,
                borderColor:
                  difficultyStyle.accentColor +
                  '40',
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {getDifficultyPillLabel(
                difficulty,
                isSpanish,
              )}
            </Text>
          </View>

          <View style={styles.timeBlock}>
            <Text
              style={[
                styles.time,
                {
                  color: colors.text,
                  fontSize:
                    width < 380 ? 44 : 52,
                },
              ]}
            >
              {time}
            </Text>

            <Text
              style={[
                styles.dateLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {translateDay(
                day,
                isSpanish,
              )}
              {' - '}
              {alarmLabel ??
                (
                  isSpanish
                    ? 'Hora de levantarse'
                    : 'Time to wake up'
                )}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          />

          <View style={styles.body}>
            <Text
              style={[
                styles.instruction,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {isSpanish
                ? 'Resuelve la operación matemática'
                : 'Solve the math operation'}
            </Text>

            <View
              style={[
                styles.mathBox,
                {
                  backgroundColor:
                    difficultyStyle.bgColor,
                  borderColor:
                    difficultyStyle.accentColor +
                    '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.mathExpression,
                  {
                    color:
                      difficultyStyle.accentColor,
                    fontSize:
                      width < 380 ? 22 : 26,
                  },
                ]}
              >
                {displayExpression} = ?
              </Text>
            </View>

            <Text
              style={[
                styles.hint,
                {
                  color:
                    difficultyStyle.accentColor +
                    '80',
                },
              ]}
            >
              {isSpanish
                ? 'Ingresa tu respuesta numérica'
                : 'Enter your numeric answer'}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor:
                    colors.bgCard,
                  borderColor: state.hasError
                    ? colors.danger
                    : difficultyStyle.accentColor +
                      '60',
                  color:
                    difficultyStyle.accentColor,
                  fontSize:
                    width < 380 ? 18 : 22,
                },
              ]}
              value={state.userInput}
              onChangeText={(value) => {
                handleInputChange(value);

                if (
                  feedbackMessage &&
                  feedbackType !== 'warning'
                ) {
                  setFeedbackMessage('');
                }
              }}
              placeholder="0"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="number-pad"
              maxLength={8}
            />

            {feedbackMessage ? (
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color: feedbackColor,
                  },
                ]}
              >
                {feedbackMessage}
              </Text>
            ) : null}

            <MissionErrorCounter
              count={errorCount}
              max={MAX_ERRORS}
              color={feedbackType === 'warning' ? difficultyStyle.accentColor : undefined}
            />

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.confirmText,
                  {
                    color:
                      difficultyStyle.textColor,
                  },
                ]}
              >
                {isSpanish
                  ? 'Confirmar'
                  : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <MissionCompleteModal
        visible={missionCompleted}
        completedCount={totalQuantity}
        totalCount={totalQuantity}
        onContinue={onComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    paddingTop: 40,
  },

  pill: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 0.5,
  },

  pillText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  timeBlock: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  time: {
    fontWeight: '500',
    letterSpacing: -1,
    lineHeight: 56,
  },

  dateLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  divider: {
    height: 0.5,
    marginHorizontal: 16,
    marginVertical: 10,
  },

  body: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
  },

  instruction: {
    fontSize: 12,
    marginBottom: 12,
  },

  mathBox: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
  },

  mathExpression: {
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    flexWrap: 'wrap',
  },

  input: {
    borderWidth: 0.5,
    borderRadius: Layout.controlRadius,
    height: 52,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'monospace',
    marginBottom: 6,
  },

  feedbackText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },

  hint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },

  confirmBtn: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },

  confirmText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
