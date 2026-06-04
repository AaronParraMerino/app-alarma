// src/features/missions/ColoredFigures/components/ColoredFigureMission.tsx
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
  Platform,
  StatusBar,
} from 'react-native';

import {
  Difficulty,
  FigureType,
} from '../types/ColoredFigures.types';
import { DIFFICULTY_STYLES } from '../constants/ColoredFigure.config';
import { useColoredFigures } from '../hooks/useColoredFigures';
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
  onMistake?: () => void;
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
      ? 'medio'
      : 'medium';
  }

  return isSpanish
    ? 'difícil'
    : 'hard';
}

function getDifficultyBadgeLabel(
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
      ? 'MEDIO'
      : 'MEDIUM';
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

export function ColoredFiguresMission({
  difficulty,
  quantity,
  onComplete,
  onMistake,
  alarmLabel,
}: Props) {
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
    currentDifficulty,
    setCurrentDifficulty,
  ] = useState<Difficulty>(difficulty);

  const [
    completedCount,
    setCompletedCount,
  ] = useState(0);

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
    missionCompleted,
    setMissionCompleted,
  ] = useState(false);

  const {
    current,
    state,
    handleInputChange,
    handleConfirm,
    reset,
  } = useColoredFigures(currentDifficulty);

  const {
    time,
    day,
  } = useCurrentTime();

  const difficultyStyle =
    DIFFICULTY_STYLES[currentDifficulty];

  const totalQuantity =
    Math.max(
      1,
      quantity,
    );

  React.useEffect(() => {
    setErrorCount(0);
    reset();
  }, [
    currentDifficulty,
    reset,
  ]);

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
        missionType: 'colored_figures',
        difficulty: currentDifficulty,
        content: {
          figure: current.figure,
          hex: current.hex,
          colorName: current.colorName,
          colorDisplayName: current.colorDisplayName,
        },
        correctAnswer: current.colorName,
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
      currentDifficulty,
      state.userInput,
    ],
  );

  const handleSubmit = () => {
    const result =
      handleConfirm();

    if (result === null) {
      return;
    }

    if (!result) {
      const nextErrorCount =
        errorCount + 1;

      const previousDifficulty =
        getPreviousDifficulty(currentDifficulty);

      saveMissionHistory(
        false,
        nextErrorCount,
      );

      onMistake?.();

      if (
        nextErrorCount >= MAX_ERRORS &&
        previousDifficulty
      ) {
        setCurrentDifficulty(previousDifficulty);
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

        setTimeout(() => {
          reset();
        }, 300);

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
            ? `Color incorrecto. Te quedan ${remainingErrors} intento${
                remainingErrors === 1
                  ? ''
                  : 's'
              }.`
            : `Incorrect color. You have ${remainingErrors} attempt${
                remainingErrors === 1
                  ? ''
                  : 's'
              } left.`,
        );
      }

      return;
    }

    const nextCompleted =
      completedCount + 1;

    saveMissionHistory(
      true,
      errorCount,
    );

    setCompletedCount(nextCompleted);
    setErrorCount(0);
    setFeedbackType('success');

    setFeedbackMessage(
      isSpanish
        ? 'Correcto.'
        : 'Correct.',
    );

    if (nextCompleted >= totalQuantity) {
      setMissionCompleted(true);

      return;
    }

    setTimeout(() => {
      setFeedbackMessage('');
      reset();
    }, 500);
  };

  const renderFigure = (
    figure: FigureType,
    color: string,
  ) => {
    if (figure === 'circle') {
      return (
        <View
          style={[
            styles.figureBase,
            styles.circle,
            {
              backgroundColor: color,
              borderColor: colors.border,
            },
          ]}
        />
      );
    }

    if (figure === 'square') {
      return (
        <View
          style={[
            styles.figureBase,
            styles.square,
            {
              backgroundColor: color,
              borderColor: colors.border,
            },
          ]}
        />
      );
    }

    if (figure === 'rectangle') {
      return (
        <View
          style={[
            styles.rectangle,
            {
              backgroundColor: color,
              borderColor: colors.border,
            },
          ]}
        />
      );
    }

    if (figure === 'diamond') {
      return (
        <View
          style={[
            styles.diamond,
            {
              backgroundColor: color,
              borderColor: colors.border,
            },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.triangle,
          {
            borderBottomColor: color,
          },
        ]}
      />
    );
  };

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
            : undefined
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View
              style={[
                styles.badge,
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
                  styles.badgeText,
                  {
                    color:
                      difficultyStyle.accentColor,
                  },
                ]}
              >
                {getDifficultyBadgeLabel(
                  currentDifficulty,
                  isSpanish,
                )}
              </Text>
            </View>

            <Text
              style={[
                styles.time,
                {
                  color: colors.text,
                },
              ]}
            >
              {time}
            </Text>

            <Text
              style={[
                styles.day,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {translateDay(
                day,
                isSpanish,
              )}
            </Text>

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
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.instruction,
                {
                  color: colors.text,
                },
              ]}
            >
              {isSpanish
                ? 'Escribe el color de la figura'
                : 'Type the color of the shape'}
            </Text>

            <View style={styles.figureContainer}>
              {renderFigure(
                current.figure,
                current.hex,
              )}
            </View>
          </View>

          <TextInput
            value={state.userInput}
            onChangeText={(value) => {
              handleInputChange(value);

              if (feedbackMessage) {
                setFeedbackMessage('');
              }
            }}
            placeholder={
              isSpanish
                ? 'Escribe el color'
                : 'Type the color'
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.bgElevated,
                borderColor:
                  difficultyStyle.accentColor,
                color: colors.text,
              },
              state.hasError && {
                borderColor: colors.danger,
              },
              state.isCompleted && {
                borderColor: colors.success,
              },
            ]}
            onSubmitEditing={handleSubmit}
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

          <View style={styles.spacer} />

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor:
                  difficultyStyle.accentColor,
              },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.confirmBtnText,
                {
                  color: colors.black,
                },
              ]}
            >
              {isSpanish
                ? 'Confirmar'
                : 'Confirm'}
            </Text>
          </TouchableOpacity>
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

  container: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 36,
    paddingBottom: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },

  badge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 6,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  time: {
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 56,
  },

  day: {
    fontSize: 14,
  },

  alarmLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  card: {
    borderRadius: Layout.cardRadius,
    padding: 22,
    borderWidth: 1,
  },

  instruction: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },

  figureContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  figureBase: {
    width: 120,
    height: 120,
    borderWidth: 1,
  },

  circle: {
    borderRadius: 60,
  },

  square: {
    borderRadius: 12,
  },

  rectangle: {
    width: 150,
    height: 95,
    borderRadius: 12,
    borderWidth: 1,
  },

  diamond: {
    width: 110,
    height: 110,
    borderRadius: 12,
    transform: [
      {
        rotate: '45deg',
      },
    ],
    borderWidth: 1,
  },

  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 130,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
  },

  feedbackText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },

  spacer: {
    flex: 1,
  },

  confirmBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
