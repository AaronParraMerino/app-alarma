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
} from 'react-native';

import { Difficulty, OperationType } from '../types/mathExercises.types';
import { DIFFICULTY_STYLES } from '../constants/mathExercises.config';
import { useMathExercises } from '../hooks/useMathExercises';
import { useCurrentTime } from '../hooks/useCurrentTime';

import { useAuth } from '../../../auth/hooks/useAuth';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
  operationType?: OperationType;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const MAX_ERRORS = 3;

function getPreviousDifficulty(difficulty: Difficulty): Difficulty | null {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);

  if (currentIndex <= 0) {
    return null;
  }

  return DIFFICULTY_ORDER[currentIndex - 1];
}

function getDifficultyLabel(difficulty: Difficulty) {
  return DIFFICULTY_STYLES[difficulty].label.toLowerCase();
}

export function MathExercisesMission({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
  operationType,
}: Props) {
  const { width } = useWindowDimensions();
  const { user, isAuthenticated, isGuest } = useAuth();

  const [missionCount, setMissionCount] = React.useState(0);
  const [difficulty, setDifficulty] =
    React.useState<Difficulty>(initialDifficulty);
  const [errorCount, setErrorCount] = React.useState(0);
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  const [feedbackType, setFeedbackType] =
    React.useState<'error' | 'warning' | 'success'>('error');

  const style = DIFFICULTY_STYLES[difficulty];
  const totalQuantity = Math.max(1, quantity);

  const {
    state,
    current,
    handleInputChange,
    handleConfirm,
    handleReplace,
  } = useMathExercises(difficulty, 1, operationType);

  const { time, day } = useCurrentTime();

  const getExpression = React.useCallback(() => {
    const exercise = current as any;

    if (!exercise) {
      return '';
    }

    if (exercise.expression) {
      return String(exercise.expression);
    }

    return `${exercise.num1 ?? ''} ${exercise.operation ?? ''} ${
      exercise.num2 ?? ''
    }`.trim();
  }, [current]);

  const getCorrectAnswer = React.useCallback(() => {
    const exercise = current as any;

    if (!exercise) {
      return '';
    }

    const storedAnswer =
      exercise.answer ??
      exercise.result ??
      exercise.correctAnswer ??
      exercise.correct_answer;

    if (storedAnswer !== undefined && storedAnswer !== null) {
      return String(storedAnswer);
    }

    const num1 = Number(exercise.num1);
    const num2 = Number(exercise.num2);
    const operation = String(exercise.operation ?? '');
    const type = String(operationType ?? exercise.operationType ?? '');

    if (Number.isNaN(num1) || Number.isNaN(num2)) {
      return '';
    }

    if (type === 'addition' || operation === '+') {
      return String(num1 + num2);
    }

    if (type === 'subtraction' || operation === '-') {
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

    if (type === 'division' || operation === '/' || operation === '÷') {
      return String(num2 === 0 ? '' : num1 / num2);
    }

    return '';
  }, [current, operationType]);

  const saveMissionHistory = React.useCallback(
    (success: boolean, nextErrorCount: number) => {
      if (!isAuthenticated || isGuest || !user?.id || !current) {
        return;
      }

      const exercise = current as any;

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

  const prevHasError = React.useRef(false);

  React.useEffect(() => {
    if (state.hasError && !prevHasError.current) {
      const nextErrorCount = errorCount + 1;
      const previousDifficulty = getPreviousDifficulty(difficulty);

      saveMissionHistory(false, nextErrorCount);

      if (nextErrorCount >= MAX_ERRORS && previousDifficulty) {
        setDifficulty(previousDifficulty);
        setErrorCount(0);
        setFeedbackType('warning');
        setFeedbackMessage(
          `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(
            previousDifficulty,
          )}.`,
        );

        handleReplace();
        prevHasError.current = state.hasError;
        return;
      }

      if (nextErrorCount >= MAX_ERRORS && !previousDifficulty) {
        setErrorCount(0);
        setFeedbackType('error');
        setFeedbackMessage(
          'Fallaste 3 veces, pero ya estás en el nivel más bajo. Intenta nuevamente.',
        );

        handleReplace();
        prevHasError.current = state.hasError;
        return;
      }

      setErrorCount(nextErrorCount);

      if (nextErrorCount === MAX_ERRORS - 1 && previousDifficulty) {
        setFeedbackType('warning');
        setFeedbackMessage(
          `1 fallo más y bajas a ${getDifficultyLabel(previousDifficulty)}.`,
        );
      } else {
        const remainingErrors = MAX_ERRORS - nextErrorCount;

        setFeedbackType('error');
        setFeedbackMessage(
          `Respuesta incorrecta. Te quedan ${remainingErrors} intento${
            remainingErrors === 1 ? '' : 's'
          }.`,
        );
      }
    }

    prevHasError.current = state.hasError;
  }, [
    state.hasError,
    errorCount,
    difficulty,
    handleReplace,
    saveMissionHistory,
  ]);

  React.useEffect(() => {
    setErrorCount(0);
  }, [current?.expression]);

  const prevCompleted = React.useRef(false);

  React.useEffect(() => {
    if (state.isCompleted && !prevCompleted.current) {
      const next = missionCount + 1;

      saveMissionHistory(true, errorCount);

      setFeedbackType('success');
      setFeedbackMessage('Correcto.');

      if (next >= totalQuantity) {
        onComplete();
      } else {
        setMissionCount(next);

        setTimeout(() => {
          setFeedbackMessage('');
          handleReplace();
        }, 500);
      }
    }

    prevCompleted.current = state.isCompleted;
  }, [
    state.isCompleted,
    missionCount,
    totalQuantity,
    errorCount,
    saveMissionHistory,
    onComplete,
    handleReplace,
  ]);

  const displayExpression = getExpression() || '...';

  const feedbackColor =
    feedbackType === 'success'
      ? Colors.success
      : feedbackType === 'warning'
      ? style.accentColor
      : Colors.danger;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screen}>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: style.bgColor,
                borderColor: style.accentColor + '40',
              },
            ]}
          >
            <Text style={[styles.pillText, { color: style.accentColor }]}>
              {style.label}
            </Text>
          </View>

          <View style={styles.timeBlock}>
            <Text
              style={[
                styles.time,
                { fontSize: width < 380 ? 44 : 52 },
              ]}
            >
              {time}
            </Text>

            <Text style={styles.dateLabel}>
              {day} - {alarmLabel ?? 'Hora de levantarse'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.body}>
            <Text style={styles.instruction}>
              Resuelve la operación matemática
            </Text>

            <View
              style={[
                styles.mathBox,
                {
                  backgroundColor: style.bgColor,
                  borderColor: style.accentColor + '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.mathExpression,
                  {
                    color: style.accentColor,
                    fontSize: width < 380 ? 22 : 26,
                  },
                ]}
              >
                {displayExpression} = ?
              </Text>
            </View>

            <Text style={[styles.hint, { color: style.accentColor + '80' }]}>
              Ingresa tu respuesta numérica
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: state.hasError
                    ? Colors.danger
                    : style.accentColor + '60',
                  color: style.accentColor,
                  fontSize: width < 380 ? 18 : 22,
                },
              ]}
              value={state.userInput}
              onChangeText={(value) => {
                handleInputChange(value);

                if (feedbackMessage && feedbackType !== 'warning') {
                  setFeedbackMessage('');
                }
              }}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={8}
            />

            {feedbackMessage ? (
              <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                {feedbackMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: style.accentColor },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, { color: style.textColor }]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
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
    color: Colors.text,
    letterSpacing: -1,
    lineHeight: 56,
  },

  dateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.bgCard,
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
