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
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';

import {
  DEFAULT_TRIVIA_CONFIG,
  TRIVIA_CATEGORIES,
  TRIVIA_DIFFICULTY_STYLES,
  TRIVIA_POINTS,
  getTriviaQuestions,
} from '../constants/trivia.config';
import {
  TriviaCategory,
  TriviaDifficulty,
  TriviaQuestion,
  TriviaTimeLimits,
} from '../types/trivia.types';

interface TriviaMissionProps {
  difficulty: TriviaDifficulty;
  categoryIds?: TriviaCategory[];
  timeLimits?: TriviaTimeLimits;
  targetScore?: number;
  alarmLabel?: string;
  onComplete: () => void;
}

type RouteProps = NativeStackScreenProps<
  MissionsStackParamList,
  'TriviaMissionScreen'
>;

function shuffle<T>(items: T[]): T[] {
  return [...items]
    .sort(() => Math.random() - 0.5);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(
  source: string,
  target: string,
): number {
  const rows =
    source.length + 1;
  const columns =
    target.length + 1;
  const matrix =
    Array.from(
      {
        length: rows,
      },
      () => Array(columns).fill(0),
    );

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (
    let column = 0;
    column < columns;
    column += 1
  ) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (
      let column = 1;
      column < columns;
      column += 1
    ) {
      const substitutionCost =
        source[row - 1] ===
        target[column - 1]
          ? 0
          : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] +
          substitutionCost,
      );
    }
  }

  return matrix[source.length][target.length];
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function scoreWrittenAnswer(
  answer: string,
  acceptedAnswers: string[],
  points: number,
): number {
  const normalizedAnswer =
    normalizeText(answer);

  if (!normalizedAnswer) {
    return 0;
  }

  const similarity =
    Math.max(
      ...acceptedAnswers.map((accepted) => {
        const normalizedAccepted =
          normalizeText(accepted);
        const maxLength =
          Math.max(
            normalizedAnswer.length,
            normalizedAccepted.length,
          );

        if (maxLength === 0) {
          return 1;
        }

        return (
          1 -
          levenshtein(
            normalizedAnswer,
            normalizedAccepted,
          ) /
            maxLength
        );
      }),
    );

  if (similarity === 1) {
    return points;
  }

  if (similarity < 0.5) {
    return 0;
  }

  return Math.min(
    points - 0.5,
    roundHalf(points * similarity),
  );
}

function categoryLabel(
  categoryId: TriviaCategory,
  isSpanish: boolean,
) {
  const category =
    TRIVIA_CATEGORIES.find(
      (item) => item.id === categoryId,
    );

  return isSpanish
    ? category?.labelEs ?? categoryId
    : category?.labelEn ?? categoryId;
}

export function TriviaMission({
  difficulty: initialDifficulty,
  categoryIds =
    DEFAULT_TRIVIA_CONFIG.categoryIds,
  timeLimits =
    DEFAULT_TRIVIA_CONFIG.timeLimits,
  targetScore =
    DEFAULT_TRIVIA_CONFIG.targetScore,
  alarmLabel,
  onComplete,
}: TriviaMissionProps) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();
  const {
    language,
  } = useTranslation();
  const isSpanish =
    language === 'es';
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
      const questions =
        getTriviaQuestions(categoryIds);

      return activeDifficulty === 'easy'
        ? questions.filter(
            (question) =>
              question.correctOptionIndexes.length ===
              1,
          )
        : questions;
    }, [
      activeDifficulty,
      categoryIds,
    ]);

  const [
    remainingQuestions,
    setRemainingQuestions,
  ] = useState<TriviaQuestion[]>(() =>
    shuffle(possibleQuestions),
  );
  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState<TriviaQuestion | null>(
    () => shuffle(possibleQuestions)[0] ?? null,
  );
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
    timeLeft,
    setTimeLeft,
  ] = useState(timeLimits[activeDifficulty]);
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
    lowerLevelAvailable,
    setLowerLevelAvailable,
  ] = useState(false);
  const [
    giveUpVisible,
    setGiveUpVisible,
  ] = useState(false);

  const lowerDifficulty =
    activeDifficulty === 'hard'
      ? 'medium'
      : 'easy';

  const nextQuestion =
    useCallback(() => {
      setRemainingQuestions((current) => {
        let pool =
          current.filter(
            (question) =>
              question.id !==
              currentQuestion?.id,
          );

        if (pool.length === 0) {
          pool =
            shuffle(
              possibleQuestions.filter(
                (question) =>
                  question.id !==
                  currentQuestion?.id,
              ),
            );
        }

        const next =
          pool[0] ??
          possibleQuestions[0] ??
          null;

        setCurrentQuestion(next);
        return pool.slice(1);
      });
      setSelectedIndexes([]);
      setWrittenAnswer('');
      setFeedback(null);
      setLocked(false);
      setTimeLeft(timeLimits[activeDifficulty]);
    }, [
      activeDifficulty,
      currentQuestion?.id,
      possibleQuestions,
      timeLimits,
    ]);

  const submitScore =
    useCallback((
      earnedPoints: number,
      timedOut = false,
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

      setLocked(true);
      setScore(nextScore);
      if (
        roundedPoints === 0 &&
        activeDifficulty !== 'easy'
      ) {
        setFailedQuestionCount((current) => {
          const nextCount = current + 1;

          if (nextCount >= 3) {
            setLowerLevelAvailable(true);
          }

          return nextCount;
        });
      }
      setFeedback({
        earned: roundedPoints,
        text: timedOut
          ? isSpanish
            ? 'Tiempo agotado'
            : 'Time is up'
          : roundedPoints === 0
            ? isSpanish
              ? 'Respuesta incorrecta'
              : 'Incorrect answer'
            : roundedPoints >=
                TRIVIA_POINTS[activeDifficulty]
              ? isSpanish
                ? 'Respuesta correcta'
                : 'Correct answer'
              : isSpanish
                ? 'Respuesta parcialmente correcta'
                : 'Partially correct answer',
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
      isSpanish,
      locked,
      nextQuestion,
      score,
      targetScore,
    ]);

  useEffect(() => {
    if (
      completed ||
      locked ||
      !currentQuestion
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        setTimeLeft((current) => {
          if (current <= 1) {
            clearInterval(interval);
            submitScore(0, true);
            return 0;
          }

          return current - 1;
        });
      }, 1000);

    return () => clearInterval(interval);
  }, [
    completed,
    currentQuestion,
    locked,
    submitScore,
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
      submitScore(
        selectedIndexes[0] ===
          currentQuestion.correctOptionIndexes[0]
          ? TRIVIA_POINTS.easy
          : 0,
      );
      return;
    }

    const correctIndexes =
      currentQuestion.correctOptionIndexes;
    const incorrectOptionCount =
      Math.max(
        1,
        (isSpanish
          ? currentQuestion.optionsEs
          : currentQuestion.optionsEn
        ).length -
          correctIndexes.length,
      );
    const selectedCorrect =
      selectedIndexes.filter(
        (index) =>
          correctIndexes.includes(index),
      ).length;
    const selectedIncorrect =
      selectedIndexes.length -
      selectedCorrect;
    const ratio =
      Math.max(
        0,
        selectedCorrect /
          correctIndexes.length -
          selectedIncorrect /
            incorrectOptionCount,
      );

    submitScore(
      TRIVIA_POINTS.medium * ratio,
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
      getTriviaQuestions(categoryIds).filter(
        (question) =>
          lowerDifficulty !== 'easy' ||
          question.correctOptionIndexes.length === 1,
      );
    const shuffledQuestions =
      shuffle(nextQuestions);

    setGiveUpVisible(false);
    setActiveDifficulty(lowerDifficulty);
    setFailedQuestionCount(0);
    setLowerLevelAvailable(false);
    setRemainingQuestions(
      shuffledQuestions.slice(1),
    );
    setCurrentQuestion(
      shuffledQuestions[0] ?? null,
    );
    setSelectedIndexes([]);
    setWrittenAnswer('');
    setFeedback(null);
    setLocked(false);
    setTimeLeft(timeLimits[lowerDifficulty]);
  };

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
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  difficultyStyle.bgColor,
              },
            ]}
          >
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={difficultyStyle.accentColor}
            />
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {isSpanish
                ? 'CULTURA GENERAL'
                : 'GENERAL KNOWLEDGE'}
            </Text>
          </View>
          <View
            style={[
              styles.timer,
              {
                borderColor:
                  difficultyStyle.accentColor +
                  '66',
              },
            ]}
          >
            <Ionicons
              name="timer-outline"
              size={17}
              color={difficultyStyle.accentColor}
            />
            <Text
              style={[
                styles.timerText,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {timeLeft}s
            </Text>
          </View>
        </View>

        {alarmLabel ? (
          <Text
            style={[
              styles.alarmLabel,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {alarmLabel}
          </Text>
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
            {categoryLabel(
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
              3,
            )}
            max={3}
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

        {activeDifficulty !== 'easy' &&
          lowerLevelAvailable &&
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
        timeLimits={route.params.timeLimits}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  timer: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  alarmLabel: {
    fontSize: 13,
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
