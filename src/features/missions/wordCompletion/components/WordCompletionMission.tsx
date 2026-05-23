// src/features/missions/wordCompletion/components/WordCompletionMission.tsx
import React, {
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';

import { Difficulty } from '../types/wordCompletion.types';
import { WordCompletionService } from '../services/WordCompletionService';
import { useWordCompletion } from '../hooks/useWordCompletion';
import { WordDisplay } from '../components/WordDisplay';
import { WordStack } from '../components/WordStack';
import { useCurrentTime } from '../../hooks/useCurrentTime';

import { useAuth } from '../../../auth/hooks/useAuth';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
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

  if (currentIndex > 0) {
    return DIFFICULTY_ORDER[currentIndex - 1];
  }

  return null;
}

function getDifficultyLabel(
  difficulty: Difficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish ? 'facil' : 'easy';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'normal' : 'normal';
  }

  return isSpanish ? 'dificil' : 'hard';
}

function getDifficultyPillLabel(
  difficulty: Difficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish ? 'FACIL' : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'NORMAL' : 'NORMAL';
  }

  return isSpanish ? 'DIFICIL' : 'HARD';
}

function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateDay(
  day: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return capitalizeFirst(day);
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

  return capitalizeFirst(day);
}

export function WordCompletionMission({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
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

  const isSpanish = language === 'es';

  const {
    user,
    isAuthenticated,
    isGuest,
  } = useAuth();

  const [
    missionCount,
    setMissionCount,
  ] = useState(0);

  const [
    difficulty,
    setDifficulty,
  ] = useState<Difficulty>(initialDifficulty);

  const [
    errorCount,
    setErrorCount,
  ] = useState(0);

  const [
    feedbackMessage,
    setFeedbackMessage,
  ] = useState('');

  const [
    feedbackType,
    setFeedbackType,
  ] = useState<
    'error' | 'warning' | 'success'
  >('error');

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const completionHandledRef =
    React.useRef(false);

  const completionTimeoutRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextMissionTimeoutRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const difficultyStyle =
    WordCompletionService.getDifficultyStyle(difficulty);

  const {
    challenges,
    state,
    current,
    handleInputChange,
    handleConfirm,
    handleReplace,
  } = useWordCompletion(difficulty, language);

  const {
    time,
    day,
  } = useCurrentTime(language);

  const handleSafeConfirm =
    React.useCallback(() => {
      if (
        completed ||
        state.isCompleted ||
        completionHandledRef.current
      ) {
        return;
      }

      handleConfirm();
    }, [
      completed,
      state.isCompleted,
      handleConfirm,
    ]);

  const isHard = difficulty === 'hard';

  const maxLength = isHard
    ? challenges[state.currentChallengeIndex]
        ?.missingIndexes.length ?? 1
    : current?.missingIndexes.length ?? 1;

  const totalMissingLetters =
    challenges.reduce(
      (total, challenge) =>
        total + challenge.missingIndexes.length,
      0,
    );

  const hintText = isHard
    ? isSpanish
      ? `${totalMissingLetters} letras faltantes`
      : `${totalMissingLetters} missing letters`
    : isSpanish
      ? `${maxLength} letra${
          maxLength > 1 ? 's' : ''
        } faltante${
          maxLength > 1
            ? 's · escríbelas juntas'
            : ''
        }`
      : `${maxLength} missing letter${
          maxLength > 1 ? 's' : ''
        }${
          maxLength > 1
            ? ' · write them together'
            : ''
        }`;

  const saveMissionHistory = React.useCallback(
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

      MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'word_completion',
        difficulty,
        content: {
          word: current.word,
          missingIndexes: current.missingIndexes,
          language,
        },
        correctAnswer:
          WordCompletionService.getExpectedAnswer(current),
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
      state.userInput,
      language,
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
    completionHandledRef.current = false;
    setErrorCount(0);
  }, [
    state.currentChallengeIndex,
  ]);

  React.useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      if (nextMissionTimeoutRef.current) {
        clearTimeout(nextMissionTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!state.isCompleted) {
      return;
    }

    if (completionHandledRef.current) {
      return;
    }

    completionHandledRef.current = true;

    if (
      isAuthenticated &&
      !isGuest &&
      user?.id &&
      current
    ) {
      MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'word_completion',
        difficulty,
        content: {
          word: current.word,
          missingIndexes: current.missingIndexes,
          language,
        },
        correctAnswer:
          WordCompletionService.getExpectedAnswer(current),
        userAnswer: state.userInput,
        success: true,
        errorCount,
        durationSeconds: null,
      });

      void syncMissionHistory(user.id);
    }

    const next =
      missionCount + 1;

    if (next >= quantity) {
      Keyboard.dismiss();
      setCompleted(true);

      completionTimeoutRef.current =
        setTimeout(onComplete, 900);
    } else {
      setMissionCount(next);
      setErrorCount(0);

      setFeedbackType('success');
      setFeedbackMessage(
        isSpanish
          ? 'Correcto.'
          : 'Correct.',
      );

      nextMissionTimeoutRef.current =
        setTimeout(() => {
          setFeedbackMessage('');
          handleReplace();
          completionHandledRef.current = false;
        }, 500);
    }
  }, [
    state.isCompleted,
    isAuthenticated,
    isGuest,
    user?.id,
    current,
    difficulty,
    state.userInput,
    errorCount,
    missionCount,
    quantity,
    onComplete,
    handleReplace,
    language,
    isSpanish,
  ]);

  const feedbackColor =
    feedbackType === 'success'
      ? colors.success
      : feedbackType === 'warning'
        ? difficultyStyle.accentColor
        : colors.danger;

  if (completed) {
    return (
      <CenteredState>
        <Text
          style={[
            styles.stateIcon,
            {
              color:
                difficultyStyle.accentColor,
            },
          ]}
        >
          OK
        </Text>

        <Text
          style={[
            styles.stateTitle,
            {
              color:
                difficultyStyle.accentColor,
            },
          ]}
        >
          {isSpanish
            ? 'Mision completada'
            : 'Mission complete'}
        </Text>

        <Text
          style={[
            styles.stateText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {isSpanish
            ? `${quantity} palabra${quantity === 1 ? '' : 's'} completada${quantity === 1 ? '' : 's'}.`
            : `${quantity} word${quantity === 1 ? '' : 's'} completed.`}
        </Text>
      </CenteredState>
    );
  }

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
                  difficultyStyle.accentColor + '40',
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
                  color: colors.textSecondary,
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
                backgroundColor: colors.border,
              },
            ]}
          />

          <View style={styles.body}>
            <Text
              style={[
                styles.instruction,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isHard
                ? isSpanish
                  ? 'Completa todas las palabras:'
                  : 'Complete all the words:'
                : isSpanish
                  ? 'Escribe la letra que falta:'
                  : 'Type the missing letter:'}
            </Text>

            {isHard ? (
              <WordStack
                challenges={challenges}
                currentIndex={
                  state.currentChallengeIndex
                }
                completedIndexes={
                  state.completedIndexes
                }
                accentColor={
                  difficultyStyle.accentColor
                }
                accentBg={
                  difficultyStyle.bgColor
                }
                isSpanish={isSpanish}
              />
            ) : (
              current && (
                <View
                  style={[
                    styles.wordBox,
                    {
                      backgroundColor:
                        colors.bgCard,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <WordDisplay
                    challenge={current}
                    accentColor={
                      difficultyStyle.accentColor
                    }
                    accentBg={
                      difficultyStyle.bgColor
                    }
                    letterSize={
                      width < 380 ? 20 : 26
                    }
                    textColor={colors.text}
                  />
                </View>
              )
            )}

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
              editable={!state.isCompleted}
              onChangeText={(value) => {
                if (state.isCompleted) {
                  return;
                }

                handleInputChange(value);

                if (
                  feedbackMessage &&
                  feedbackType !== 'warning'
                ) {
                  setFeedbackMessage('');
                }
              }}
              autoCapitalize="characters"
              placeholder={
                Array(maxLength)
                  .fill('_')
                  .join(' ')
              }
              placeholderTextColor={
                colors.textMuted
              }
              maxLength={maxLength}
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

            <Text
              style={[
                styles.hint,
                {
                  color:
                    difficultyStyle.accentColor +
                    '88',
                },
              ]}
            >
              {hintText}
            </Text>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
              onPress={handleSafeConfirm}
              disabled={
                completed ||
                state.isCompleted ||
                completionHandledRef.current
              }
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
                {isHard
                  ? isSpanish
                    ? `Confirmar palabra ${
                        state.currentChallengeIndex + 1
                      }`
                    : `Confirm word ${
                        state.currentChallengeIndex + 1
                      }`
                  : isSpanish
                    ? 'Confirmar'
                    : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CenteredState({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

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

      <View
        style={[
          styles.centered,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        {children}
      </View>
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

  wordBox: {
    borderRadius: Layout.controlRadius,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
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
    marginBottom: 4,
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

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  stateIcon: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },

  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
