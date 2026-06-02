import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Modal as AppModal } from '../../../../shared/components/ui/Modal';
import { MissionCompleteModal } from '../../../../shared/components/missions/MissionCompleteModal';
import { MissionErrorCounter } from '../../../../shared/components/missions/MissionErrorCounter';
import { PracticeExitButton } from '../../../../shared/components/missions/PracticeExitButton';
import { Layout } from '../../../../shared/theme/layout';
import { Colors } from '../../../../shared/theme/colors';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { useAuth } from '../../../auth/hooks/useAuth';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';

import {
  DEFAULT_TRIVIA_CONFIG,
  TRIVIA_DIFFICULTY_STYLES,
  TRIVIA_POINTS,
} from '../constants/trivia.config';
import {
  TriviaCategory,
  TriviaDifficulty,
  TriviaQuestion,
} from '../types/trivia.types';
import {
  buildQuestionDeck,
  getPossibleTriviaQuestions,
  getTriviaCategoryLabel,
  getTriviaFeedbackText,
  roundHalf,
  scoreEasyAnswer,
  scoreMediumAnswer,
  scoreWrittenAnswer,
  shuffleSingleQuestionOptions,
} from '../services/triviaMission.service';

interface TriviaMissionProps {
  difficulty: TriviaDifficulty;
  categoryIds?: TriviaCategory[];
  targetScore?: number;
  alarmLabel?: string;
  onComplete: () => void;
  onMistake?: () => void;
}

type RouteProps = NativeStackScreenProps<
  MissionsStackParamList,
  'TriviaMissionScreen'
>;

function parseAlarmLabel(value?: string) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2}:\d{2})(?:\s-\s(.+))?$/);

  return {
    time: match?.[1] ?? value,
    label: match?.[2],
  };
}

function getDifficultyPillLabel(
  difficulty: TriviaDifficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish ? 'FACIL' : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'MEDIO' : 'MEDIUM';
  }

  return isSpanish ? 'DIFICIL' : 'HARD';
}

const DOWNGRADE_TAP_COUNT = 6;

export function TriviaMission({
  difficulty: initialDifficulty,
  categoryIds =
    DEFAULT_TRIVIA_CONFIG.categoryIds,
  targetScore =
    DEFAULT_TRIVIA_CONFIG.targetScore,
  alarmLabel,
  onComplete,
  onMistake,
}: TriviaMissionProps) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();
  const {
    width,
  } = useWindowDimensions();
  const {
    language,
  } = useTranslation();
  const {
    user,
    isAuthenticated,
    isGuest,
  } = useAuth();
  const isSpanish =
    language === 'es';
  const alarmInfo =
    useMemo(() => parseAlarmLabel(alarmLabel), [alarmLabel]);
  const [
    activeDifficulty,
    setActiveDifficulty,
  ] = useState<TriviaDifficulty>(
    initialDifficulty,
  );
  const difficultyStyle =
    TRIVIA_DIFFICULTY_STYLES[activeDifficulty];
  const possibleQuestions =
    useMemo(() => {
      return getPossibleTriviaQuestions(
        categoryIds,
        activeDifficulty,
      );
    }, [
      activeDifficulty,
      categoryIds,
    ]);

  const [
    questionDeck,
    setQuestionDeck,
  ] = useState<{
    currentQuestion: TriviaQuestion | null;
    remainingQuestions: TriviaQuestion[];
  }>(() => {
    const deck = buildQuestionDeck(possibleQuestions);

    return {
      currentQuestion: deck[0] ?? null,
      remainingQuestions: deck.slice(1),
    };
  });
  const currentQuestion =
    questionDeck.currentQuestion;
  const [
    selectedIndexes,
    setSelectedIndexes,
  ] = useState<number[]>([]);
  const [
    writtenAnswer,
    setWrittenAnswer,
  ] = useState('');
  const [
    score,
    setScore,
  ] = useState(0);
  const [
    locked,
    setLocked,
  ] = useState(false);
  const [
    feedback,
    setFeedback,
  ] = useState<{
    text: string;
    earned: number;
  } | null>(null);
  const [
    completed,
    setCompleted,
  ] = useState(false);
  const [
    failedQuestionCount,
    setFailedQuestionCount,
  ] = useState(0);
  const [
    giveUpVisible,
    setGiveUpVisible,
  ] = useState(false);
  const [
    downgradeTapCount,
    setDowngradeTapCount,
  ] = useState(0);

  const lowerDifficulty =
    activeDifficulty === 'hard'
      ? 'medium'
      : 'easy';

  const downgradeErrorLimit =
    activeDifficulty === 'easy'
      ? 0
      : Math.max(
          1,
          Math.ceil(
            targetScore /
              TRIVIA_POINTS[activeDifficulty],
          ) + 2,
        );

  const nextQuestion =
    useCallback(() => {
      setQuestionDeck((current) => {
        let pool =
          current.remainingQuestions.filter(
            (question) =>
              question.id !==
              current.currentQuestion?.id,
          );

        if (pool.length === 0) {
          pool =
            buildQuestionDeck(
              possibleQuestions.filter(
                (question) =>
                  question.id !==
                  current.currentQuestion?.id,
              ),
            );
        }

        const next =
          pool[0] ??
          (possibleQuestions[0]
            ? shuffleSingleQuestionOptions(possibleQuestions[0])
            : null) ??
          null;

        return {
          currentQuestion: next,
          remainingQuestions: pool.slice(1),
        };
      });
      setSelectedIndexes([]);
      setWrittenAnswer('');
      setFeedback(null);
      setLocked(false);
    }, [
      possibleQuestions,
    ]);

  const submitScore =
    useCallback((
      earnedPoints: number,
    ) => {
      if (locked || !currentQuestion) {
        return;
      }

      const roundedPoints =
        roundHalf(earnedPoints);
      const nextScore =
        Math.min(
          targetScore,
          roundHalf(score + roundedPoints),
        );
      const success =
        roundedPoints > 0;
      const nextErrorCount =
        !success && activeDifficulty !== 'easy'
          ? failedQuestionCount + 1
          : failedQuestionCount;
      const localizedOptions =
        isSpanish
          ? currentQuestion.optionsEs
          : currentQuestion.optionsEn;
      const correctAnswer =
        activeDifficulty === 'hard'
          ? (
              isSpanish
                ? currentQuestion.acceptedAnswersEs
                : currentQuestion.acceptedAnswersEn
            )[0] ?? ''
          : currentQuestion.correctOptionIndexes
              .map((index) => localizedOptions[index])
              .filter(Boolean)
              .join(', ');
      const userAnswer =
        activeDifficulty === 'hard'
          ? writtenAnswer.trim()
          : selectedIndexes
              .map((index) => localizedOptions[index])
              .filter(Boolean)
              .join(', ');

      setLocked(true);
      setScore(nextScore);
      if (roundedPoints === 0) {
        onMistake?.();
      }

      if (
        isAuthenticated &&
        !isGuest &&
        user?.id
      ) {
        MissionHistoryLocalService.save({
          userId: user.id,
          missionType: 'trivia',
          difficulty: activeDifficulty,
          content: {
            category: currentQuestion.category,
            prompt: isSpanish
              ? currentQuestion.promptEs
              : currentQuestion.promptEn,
            targetScore,
            scoreBefore: score,
            scoreAfter: nextScore,
            earnedPoints: roundedPoints,
            pointsPerQuestion:
              TRIVIA_POINTS[activeDifficulty],
          },
          correctAnswer,
          userAnswer: userAnswer || 'sin_respuesta',
          success,
          errorCount: nextErrorCount,
          durationSeconds: null,
        });

        void syncMissionHistory(user.id);
      }

      if (
        roundedPoints === 0 &&
        activeDifficulty !== 'easy'
      ) {
        setFailedQuestionCount((current) => {
          return current + 1;
        });
      }
      setFeedback({
        earned: roundedPoints,
        text: getTriviaFeedbackText(
          roundedPoints,
          activeDifficulty,
          isSpanish,
        ),
      });

      if (
        nextScore >= targetScore
      ) {
        setCompleted(true);
        return;
      }

      setTimeout(() => {
        nextQuestion();
      }, 1150);
    }, [
      currentQuestion,
      activeDifficulty,
      failedQuestionCount,
      isAuthenticated,
      isGuest,
      isSpanish,
      locked,
      nextQuestion,
      onMistake,
      score,
      selectedIndexes,
      targetScore,
      user?.id,
      writtenAnswer,
    ]);

  const handleOptionPress = (
    index: number,
  ) => {
    if (locked) {
      return;
    }

    if (activeDifficulty === 'easy') {
      setSelectedIndexes([index]);
      return;
    }

    setSelectedIndexes((current) =>
      current.includes(index)
        ? current.filter(
            (selected) =>
              selected !== index,
          )
        : [
            ...current,
            index,
          ],
    );
  };

  const submitAnswer = () => {
    if (!currentQuestion || locked) {
      return;
    }

    if (activeDifficulty === 'hard') {
      submitScore(
        scoreWrittenAnswer(
          writtenAnswer,
          isSpanish
            ? currentQuestion.acceptedAnswersEs
            : currentQuestion.acceptedAnswersEn,
          TRIVIA_POINTS.hard,
        ),
      );
      return;
    }

    if (activeDifficulty === 'easy') {
      submitScore(scoreEasyAnswer(selectedIndexes, currentQuestion));
      return;
    }

    submitScore(
      scoreMediumAnswer(
        selectedIndexes,
        currentQuestion,
        options.length,
      ),
    );
  };

  const options =
    currentQuestion
      ? isSpanish
        ? currentQuestion.optionsEs
        : currentQuestion.optionsEn
      : [];
  const canSubmit =
    activeDifficulty === 'hard'
      ? writtenAnswer.trim().length > 0
      : selectedIndexes.length > 0;

  const downgradeLevel = () => {
    const nextQuestions =
      getPossibleTriviaQuestions(
        categoryIds,
        lowerDifficulty,
      );
    const shuffledQuestions =
      buildQuestionDeck(nextQuestions);

    setGiveUpVisible(false);
    setActiveDifficulty(lowerDifficulty);
    setFailedQuestionCount(0);
    setDowngradeTapCount(0);
    setQuestionDeck({
      currentQuestion: shuffledQuestions[0] ?? null,
      remainingQuestions: shuffledQuestions.slice(1),
    });
    setSelectedIndexes([]);
    setWrittenAnswer('');
    setFeedback(null);
    setLocked(false);
  };

  useEffect(() => {
    if (
      activeDifficulty !== 'easy' &&
      failedQuestionCount >= downgradeErrorLimit
    ) {
      downgradeLevel();
    }
  }, [
    activeDifficulty,
    downgradeErrorLimit,
    failedQuestionCount,
  ]);

  const handleDifficultyBadgePress =
    useCallback(() => {
      if (
        activeDifficulty === 'easy' ||
        completed ||
        failedQuestionCount === 0
      ) {
        setDowngradeTapCount(0);
        return;
      }

      setDowngradeTapCount((count) => {
        const nextCount =
          count + 1;

        if (nextCount >= DOWNGRADE_TAP_COUNT) {
          setGiveUpVisible(true);
          return 0;
        }

        return nextCount;
      });
    }, [
      activeDifficulty,
      completed,
      failedQuestionCount,
    ]);

  if (!currentQuestion) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.bg,
          },
        ]}
      />
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

      <MissionCompleteModal
        visible={completed}
        completedCount={targetScore}
        totalCount={targetScore}
        onContinue={onComplete}
      />

      <AppModal
        visible={giveUpVisible}
        type="warning"
        title={
          isSpanish
            ? '¿Seguro que quieres bajar de nivel?'
            : 'Are you sure you want to lower the level?'
        }
        message={
          isSpanish
            ? `Continuarás con tus ${score} puntos, pero las siguientes preguntas serán de nivel ${lowerDifficulty === 'medium' ? 'medio' : 'fácil'}.`
            : `You will keep your ${score} points, but the following questions will be on ${lowerDifficulty === 'medium' ? 'medium' : 'easy'} level.`
        }
        closeOnBackdropPress
        onClose={() => setGiveUpVisible(false)}
        cancelAction={{
          label: isSpanish
            ? 'Seguir intentando'
            : 'Keep trying',
          onPress: () =>
            setGiveUpVisible(false),
        }}
        confirmAction={{
          label: isSpanish
            ? 'Sí, bajar nivel'
            : 'Yes, lower level',
          onPress: downgradeLevel,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[
              styles.badge,
              {
                backgroundColor:
                  difficultyStyle.bgColor,
                borderColor:
                  difficultyStyle.accentColor +
                  '40',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isSpanish
                ? 'Nivel de cultura general'
                : 'General knowledge level'
            }
            onPress={handleDifficultyBadgePress}
            activeOpacity={
              activeDifficulty !== 'easy' &&
              failedQuestionCount > 0
                ? 0.78
                : 1
            }
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {getDifficultyPillLabel(
                activeDifficulty,
                isSpanish,
              )}
            </Text>
          </TouchableOpacity>
        </View>

        {alarmInfo ? (
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
              {alarmInfo.time}
            </Text>

            <Text
              style={[
                styles.dateLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {alarmInfo.label ??
                (
                  isSpanish
                    ? 'Hora de levantarse'
                    : 'Time to wake up'
                )}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.scorePanel,
            {
              borderColor:
                difficultyStyle.accentColor +
                '55',
              backgroundColor:
                difficultyStyle.bgColor,
            },
          ]}
        >
          <Text
            style={[
              styles.score,
              {
                color:
                  difficultyStyle.accentColor,
              },
            ]}
          >
            {score}/{targetScore}
          </Text>
          <Text
            style={[
              styles.scoreCaption,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? 'puntos'
              : 'points'}
          </Text>
        </View>

        <View
          style={[
            styles.questionCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.category,
              {
                color:
                  difficultyStyle.accentColor,
              },
            ]}
          >
            {getTriviaCategoryLabel(
              currentQuestion.category,
              isSpanish,
            )}
          </Text>
          <Text
            style={[
              styles.question,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish
              ? currentQuestion.promptEs
              : currentQuestion.promptEn}
          </Text>

          {activeDifficulty === 'hard' ? (
            <TextInput
              style={[
                styles.answerInput,
                {
                  color: colors.text,
                  borderColor:
                    difficultyStyle.accentColor +
                    '66',
                  backgroundColor:
                    colors.bgElevated,
                },
              ]}
              value={writtenAnswer}
              onChangeText={setWrittenAnswer}
              editable={!locked}
              placeholder={
                isSpanish
                  ? 'Escribe tu respuesta'
                  : 'Write your answer'
              }
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="sentences"
            />
          ) : (
            <View style={styles.optionList}>
              {options.map(
                (option, index) => {
                  const selected =
                    selectedIndexes.includes(
                      index,
                    );

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.option,
                        {
                          borderColor: selected
                            ? difficultyStyle.accentColor
                            : colors.border,
                          backgroundColor: selected
                            ? difficultyStyle.bgColor
                            : colors.bgElevated,
                        },
                      ]}
                      onPress={() =>
                        handleOptionPress(index)
                      }
                      disabled={locked}
                      activeOpacity={0.84}
                    >
                      <Ionicons
                        name={
                          activeDifficulty === 'easy'
                            ? selected
                              ? 'radio-button-on'
                              : 'radio-button-off'
                            : selected
                              ? 'checkbox'
                              : 'square-outline'
                        }
                        size={21}
                        color={
                          selected
                            ? difficultyStyle.accentColor
                            : colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
          )}
        </View>

        {feedback ? (
          <View
            style={[
              styles.feedback,
              {
                borderColor:
                  feedback.earned > 0
                    ? difficultyStyle.accentColor
                    : colors.danger,
              },
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                {
                  color:
                    feedback.earned > 0
                      ? difficultyStyle.accentColor
                      : colors.danger,
                },
              ]}
            >
              {feedback.text}
              {'  '}
              +{feedback.earned}
            </Text>
          </View>
        ) : null}

        {activeDifficulty !== 'easy' ? (
          <MissionErrorCounter
            count={Math.min(
              failedQuestionCount,
              downgradeErrorLimit,
            )}
            max={downgradeErrorLimit}
            color={difficultyStyle.accentColor}
          />
        ) : null}

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor:
                difficultyStyle.accentColor,
            },
            (!canSubmit || locked) &&
              styles.disabledButton,
          ]}
          onPress={submitAnswer}
          disabled={!canSubmit || locked}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.submitText,
              {
                color:
                  difficultyStyle.textColor,
              },
            ]}
          >
            {isSpanish
              ? 'Confirmar respuesta'
              : 'Confirm answer'}
          </Text>
        </TouchableOpacity>

        {false &&
          activeDifficulty !== 'easy' &&
          false &&
          !locked &&
          !completed ? (
            <TouchableOpacity
              style={styles.giveUpButton}
              onPress={() =>
                setGiveUpVisible(true)
              }
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.giveUpText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {activeDifficulty === 'hard'
                  ? isSpanish
                    ? 'Es muy difícil para mí'
                    : 'This is too hard for me'
                  : isSpanish
                    ? 'Bajar a fácil'
                    : 'Lower to easy'}
              </Text>
            </TouchableOpacity>
          ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function TriviaMissionScreen({
  navigation,
  route,
}: RouteProps) {
  return (
    <View style={styles.route}>
      <TriviaMission
        difficulty={route.params.difficulty}
        categoryIds={route.params.categoryIds}
        targetScore={route.params.targetScore}
        onComplete={() =>
          navigation.navigate(
            'MissionSelector',
          )
        }
      />
      {route.params.practice ? (
        <PracticeExitButton
          onPress={() => navigation.goBack()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  route: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 48,
    paddingBottom: 30,
    justifyContent: 'center',
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  timeBlock: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  time: {
    fontWeight: '500',
    letterSpacing: -1,
    lineHeight: 56,
  },
  dateLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  scorePanel: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 27,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scoreCaption: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: 17,
    gap: 13,
  },
  category: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
  },
  optionList: {
    gap: 9,
  },
  option: {
    minHeight: 49,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  answerInput: {
    width: '100%',
    minHeight: 54,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 13,
    fontSize: 16,
    fontWeight: '600',
  },
  feedback: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '800',
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.43,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '900',
  },
  giveUpButton: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -7,
  },
  giveUpText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
