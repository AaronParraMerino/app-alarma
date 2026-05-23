// src/features/missions/MovementMission/screens/MovementMissionScreen.tsx
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  MovementDifficulty,
  MovementMissionConfig,
  MovementMissionUserConfig,
} from '../types/movement.types';
import { buildMovementMissionConfig } from '../services/movementMissionBuilder';
import {
  MovementStepResultEvent,
  useMovementMission,
} from '../hooks/useMovementMission';
import { DIFFICULTY_STYLES } from '../constants/movementConstants';
import { MOVEMENT_IMAGES } from '../constants/movementAssets';
import { SensorBar } from '../components/SensorBar';
import { StepRing } from '../components/StepRing';
import { useCurrentTime } from '../hooks/useCurrentTime';

import { useAuth } from '../../../auth/hooks/useAuth';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';

interface MovementMissionScreenProps {
  userConfig: MovementMissionUserConfig;
  onSuccess: (result: { durationMs: number }) => void;
  alarmLabel?: string;
}

const DIFFICULTY_ORDER: MovementDifficulty[] = ['easy', 'medium', 'hard'];
const MAX_ERRORS = 3;

function getPreviousDifficulty(
  difficulty: MovementDifficulty,
): MovementDifficulty | null {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  return currentIndex > 0 ? DIFFICULTY_ORDER[currentIndex - 1] : null;
}

function getDifficultyLabel(difficulty: MovementDifficulty) {
  return DIFFICULTY_STYLES[difficulty].label.toLowerCase();
}

export function MovementMissionScreen({
  userConfig,
  onSuccess,
  alarmLabel = 'Hora de levantarse',
}: MovementMissionScreenProps) {
  const { width, height } = useWindowDimensions();
  const { colors, statusBarStyle } = useAppTheme();

  const { time, day } = useCurrentTime();
  const { user, isAuthenticated, isGuest } = useAuth();

  const savedStepResultIds = React.useRef<Set<string>>(new Set());

  const [difficulty, setDifficulty] = React.useState<MovementDifficulty>(
    userConfig.difficulty,
  );

  const [errorCount, setErrorCount] = React.useState(0);
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  const [feedbackType, setFeedbackType] =
    React.useState<'error' | 'warning' | 'success'>('error');

  const [config, setConfig] = React.useState<MovementMissionConfig>(() =>
    buildMovementMissionConfig({
      ...userConfig,
      difficulty: userConfig.difficulty,
    }),
  );

  const saveStepResult = React.useCallback(
    (stepResult: MovementStepResultEvent) => {
      if (!isAuthenticated || isGuest || !user?.id) {
        return;
      }

      if (savedStepResultIds.current.has(stepResult.id)) return;

      savedStepResultIds.current.add(stepResult.id);

      try {
        MissionHistoryLocalService.save({
          userId: user.id,
          missionType: 'movement',
          difficulty,
          content: {
            stepIndex: stepResult.stepIndex + 1,
            totalSteps: stepResult.totalSteps,
            movementType: stepResult.type,
            label: stepResult.label,
          },
          correctAnswer: stepResult.label,
          userAnswer: stepResult.success
            ? 'movement_detected'
            : stepResult.errorReason ?? 'movement_not_validated',
          success: stepResult.success,
          errorCount: stepResult.success ? 0 : 1,
          durationSeconds: stepResult.durationSeconds,
        });

        void syncMissionHistory(user.id);
      } catch (error) {
        savedStepResultIds.current.delete(stepResult.id);
      }
    },
    [isAuthenticated, isGuest, user?.id, difficulty],
  );

  const handleStepResult = React.useCallback(
    (stepResult: MovementStepResultEvent) => {
      saveStepResult(stepResult);

      if (stepResult.success) {
        setFeedbackType('success');
        setFeedbackMessage('Correcto.');
        return;
      }

      const nextErrorCount = errorCount + 1;
      const previousDifficulty = getPreviousDifficulty(difficulty);

      if (nextErrorCount >= MAX_ERRORS && previousDifficulty) {
        setDifficulty(previousDifficulty);
        setErrorCount(0);
        setFeedbackType('warning');
        setFeedbackMessage(
          `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(
            previousDifficulty,
          )}.`,
        );

        setConfig(
          buildMovementMissionConfig({
            difficulty: previousDifficulty,
            quantity: userConfig.quantity,
          }),
        );

        return;
      }

      if (nextErrorCount >= MAX_ERRORS && !previousDifficulty) {
        setErrorCount(0);
        setFeedbackType('error');
        setFeedbackMessage(
          'Fallaste 3 veces, pero ya estas en el nivel mas bajo. Intenta nuevamente.',
        );

        setConfig(
          buildMovementMissionConfig({
            difficulty,
            quantity: userConfig.quantity,
          }),
        );

        return;
      }

      setErrorCount(nextErrorCount);

      if (nextErrorCount === MAX_ERRORS - 1 && previousDifficulty) {
        setFeedbackType('warning');
        setFeedbackMessage(
          `1 fallo mas y bajas a ${getDifficultyLabel(previousDifficulty)}.`,
        );
      } else {
        const remainingErrors = MAX_ERRORS - nextErrorCount;

        setFeedbackType('error');
        setFeedbackMessage(
          `Movimiento no validado. Te quedan ${remainingErrors} intento${
            remainingErrors === 1 ? '' : 's'
          }.`,
        );
      }
    },
    [difficulty, errorCount, saveStepResult, userConfig.quantity],
  );

  const {
    phase,
    currentStepIndex,
    stepProgress,
    countdown,
    capabilities,
    incompatible,
    result,
    currentMagnitude,
    detectionRatio,
    showStepError,
    start,
  } = useMovementMission(config, handleStepResult);

  const difficultyStyle = DIFFICULTY_STYLES[difficulty];
  const currentStep = config.steps[currentStepIndex];

  const isSmall = width < 360;
  const isShort = height < 680;
  const ringSize = isSmall ? 132 : isShort ? 140 : 154;

  const displayAlarmLabel =
    !alarmLabel || alarmLabel === 'Alarma'
      ? 'Hora de levantarse'
      : alarmLabel;

  const handleStart = React.useCallback(() => {
    if (feedbackType !== 'warning') {
      setFeedbackMessage('');
    }

    start();
  }, [feedbackType, start]);

  useEffect(() => {
    if (phase === 'success' && result) {
      const timeout = setTimeout(
        () => onSuccess({ durationMs: result.durationMs }),
        900,
      );

      return () => clearTimeout(timeout);
    }
  }, [onSuccess, phase, result]);

  if (capabilities && incompatible) {
    return (
      <CenteredState>
        <Text style={[styles.stateIcon, { color: colors.text }]}>SENSOR</Text>

        <Text style={[styles.stateTitle, { color: colors.text }]}>
          Dispositivo no compatible
        </Text>

        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Esta mision necesita acelerometro o giroscopio para validar el
          movimiento.
        </Text>
      </CenteredState>
    );
  }

  if (phase === 'success') {
    return (
      <CenteredState>
        <Text style={[styles.stateIcon, { color: difficultyStyle.accentColor }]}>
          OK
        </Text>

        <Text
          style={[styles.stateTitle, { color: difficultyStyle.accentColor }]}
        >
          Mision completada
        </Text>

        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          {config.steps.length} movimientos correctos.
        </Text>
      </CenteredState>
    );
  }

  const feedbackColor =
    feedbackType === 'success'
      ? colors.success
      : feedbackType === 'warning'
        ? difficultyStyle.accentColor
        : colors.danger;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: difficultyStyle.bgColor,
              borderColor: difficultyStyle.accentColor + '40',
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              {
                color: difficultyStyle.accentColor,
              },
            ]}
          >
            {difficultyStyle.label}
          </Text>
        </View>

        <View style={styles.timeBlock}>
          <Text
            style={[
              styles.time,
              {
                color: colors.text,
                fontSize: width < 380 ? 44 : 52,
              },
            ]}
          >
            {time}
          </Text>

          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
            {day} - {displayAlarmLabel}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.body}>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            {phase === 'idle'
              ? 'Realiza el movimiento:'
              : currentStep?.instruction ?? 'Realiza el movimiento:'}
          </Text>

          {phase === 'countdown' ? (
            <View
              style={[
                styles.countdown,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.countdownNumber,
                  {
                    color: difficultyStyle.accentColor,
                  },
                ]}
              >
                {countdown}
              </Text>

              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Preparate...
              </Text>
            </View>
          ) : currentStep ? (
            <View
              style={[
                styles.missionBox,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
            >
              <StepRing
                progress={stepProgress}
                color={difficultyStyle.accentColor}
                imageSource={MOVEMENT_IMAGES[currentStep.type]}
                size={ringSize}
              />

              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {currentStep.label}
              </Text>

              <Text
                style={[styles.stepDetail, { color: colors.textSecondary }]}
              >
                {currentStep.detail}
              </Text>

              <View style={styles.sensorBlock}>
                <SensorBar
                  magnitude={currentMagnitude}
                  color={difficultyStyle.accentColor}
                  maxMagnitude={30}
                />

                <Text
                  style={[
                    styles.hint,
                    {
                      color: difficultyStyle.accentColor + '88',
                    },
                  ]}
                >
                  Validacion {Math.round(Math.min(detectionRatio, 1) * 100)}%
                </Text>
              </View>

              <Text style={[styles.stepCounter, { color: colors.textSecondary }]}>
                Paso {Math.min(currentStepIndex + 1, config.steps.length)} /{' '}
                {config.steps.length}
              </Text>
            </View>
          ) : null}

          {phase === 'idle' && (
            <>
              {(showStepError || feedbackMessage) && (
                <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                  {feedbackMessage ||
                    'Movimiento no validado, intenta de nuevo'}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: difficultyStyle.accentColor,
                  },
                ]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.confirmText,
                    {
                      color: difficultyStyle.textColor,
                    },
                  ]}
                >
                  {currentStepIndex > 0 ||
                  config.steps.some((step) => step.completed)
                    ? `Comenzar paso ${currentStepIndex + 1}`
                    : 'Comenzar'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  const { colors, statusBarStyle } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
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

  feedbackText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },

  missionBox: {
    flex: 1,
    borderRadius: Layout.controlRadius,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },

  stepDetail: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },

  sensorBlock: {
    width: '86%',
    alignItems: 'center',
    gap: 6,
  },

  stepCounter: {
    fontSize: 12,
    marginTop: 10,
  },

  countdown: {
    flex: 1,
    borderRadius: Layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  countdownNumber: {
    fontSize: 104,
    fontWeight: '200',
    lineHeight: 112,
  },

  hint: {
    fontSize: 11,
    textAlign: 'center',
  },

  confirmBtn: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
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
