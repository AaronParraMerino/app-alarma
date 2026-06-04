// src/features/missions/MovementMission/screens/MovementMissionScreen.tsx
import React from 'react';
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
import { useCurrentTime } from '../../hooks/useCurrentTime';

import { useAuth } from '../../../auth/hooks/useAuth';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';
import { MissionCompleteModal } from '../../../../shared/components/missions/MissionCompleteModal';
import { MissionErrorCounter } from '../../../../shared/components/missions/MissionErrorCounter';

interface MovementMissionScreenProps {
  userConfig: MovementMissionUserConfig;
  onSuccess: (
    result: {
      durationMs: number;
    },
  ) => void;
  onMistake?: () => void;
  alarmLabel?: string;
}

const DIFFICULTY_ORDER: MovementDifficulty[] = [
  'easy',
  'medium',
  'hard',
];

const MAX_ERRORS = 3;

function getPreviousDifficulty(
  difficulty: MovementDifficulty,
): MovementDifficulty | null {
  const currentIndex =
    DIFFICULTY_ORDER.indexOf(difficulty);

  if (currentIndex > 0) {
    return DIFFICULTY_ORDER[currentIndex - 1];
  }

  return null;
}

function getDifficultyLabel(
  difficulty: MovementDifficulty,
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

function getDifficultyPillLabel(
  difficulty: MovementDifficulty,
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
    .replace(
      /[\u0300-\u036f]/g,
      '',
    );

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

function translateMovementText(
  text: string | undefined,
  isSpanish: boolean,
): string {
  if (!text) {
    return '';
  }

  if (isSpanish) {
    return text;
  }

  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    );

  if (
    normalized.includes('agita') ||
    normalized.includes('agitar') ||
    normalized.includes('sacude') ||
    normalized.includes('sacudir')
  ) {
    return 'Shake the phone';
  }

  if (
    normalized.includes('arriba') ||
    normalized.includes('levanta')
  ) {
    return 'Move the phone up';
  }

  if (
    normalized.includes('abajo') ||
    normalized.includes('baja')
  ) {
    return 'Move the phone down';
  }

  if (normalized.includes('izquierda')) {
    return 'Move the phone to the left';
  }

  if (normalized.includes('derecha')) {
    return 'Move the phone to the right';
  }

  if (
    normalized.includes('gira') ||
    normalized.includes('girar') ||
    normalized.includes('rota') ||
    normalized.includes('rotar')
  ) {
    return 'Rotate the phone';
  }

  if (
    normalized.includes('inclina') ||
    normalized.includes('inclinar')
  ) {
    return 'Tilt the phone';
  }

  if (
    normalized.includes('camina') ||
    normalized.includes('caminar') ||
    normalized.includes('pasos')
  ) {
    return 'Walk';
  }

  if (
    normalized.includes('salta') ||
    normalized.includes('saltar') ||
    normalized.includes('salto')
  ) {
    return 'Jump';
  }

  if (normalized.includes('realiza el movimiento')) {
    return 'Perform the movement';
  }

  if (
    normalized.includes('mantener') ||
    normalized.includes('manten')
  ) {
    return 'Keep the movement until validation is complete';
  }

  return text
    .replace(/teléfono/gi, 'phone')
    .replace(/telefono/gi, 'phone')
    .replace(/movimiento/gi, 'movement')
    .replace(/movimientos/gi, 'movements');
}

export function MovementMissionScreen({
  userConfig,
  onSuccess,
  onMistake,
  alarmLabel,
}: MovementMissionScreenProps) {
  const {
    width,
    height,
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
    time,
    day,
  } = useCurrentTime(language);

  const {
    user,
    isAuthenticated,
    isGuest,
  } = useAuth();

  const savedStepResultIds =
    React.useRef<Set<string>>(
      new Set(),
    );

  const [
    difficulty,
    setDifficulty,
  ] = React.useState<MovementDifficulty>(
    userConfig.difficulty,
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
    config,
    setConfig,
  ] = React.useState<MovementMissionConfig>(() =>
    buildMovementMissionConfig({
      ...userConfig,
      difficulty: userConfig.difficulty,
    }),
  );

  const saveStepResult = React.useCallback(
    (
      stepResult: MovementStepResultEvent,
    ) => {
      if (
        !isAuthenticated ||
        isGuest ||
        !user?.id
      ) {
        return;
      }

      if (
        savedStepResultIds.current.has(
          stepResult.id,
        )
      ) {
        return;
      }

      savedStepResultIds.current.add(
        stepResult.id,
      );

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
            : stepResult.errorReason ??
              'movement_not_validated',
          success: stepResult.success,
          errorCount: stepResult.success ? 0 : 1,
          durationSeconds:
            stepResult.durationSeconds,
        });

        void syncMissionHistory(user.id);
      } catch (error) {
        savedStepResultIds.current.delete(
          stepResult.id,
        );
      }
    },
    [
      isAuthenticated,
      isGuest,
      user?.id,
      difficulty,
    ],
  );

  const handleStepResult = React.useCallback(
    (
      stepResult: MovementStepResultEvent,
    ) => {
      saveStepResult(stepResult);

      if (stepResult.success) {
        setFeedbackType('success');

        setFeedbackMessage(
          isSpanish
            ? 'Correcto.'
            : 'Correct.',
        );

        return;
      }

      const nextErrorCount =
        errorCount + 1;

      onMistake?.();

      const previousDifficulty =
        getPreviousDifficulty(difficulty);

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

        setConfig(
          buildMovementMissionConfig({
            difficulty: previousDifficulty,
            quantity: userConfig.quantity,
          }),
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

        setConfig(
          buildMovementMissionConfig({
            difficulty,
            quantity: userConfig.quantity,
          }),
        );

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
            ? `Movimiento no validado. Te quedan ${remainingErrors} intento${
                remainingErrors === 1
                  ? ''
                  : 's'
              }.`
            : `Movement not validated. You have ${remainingErrors} attempt${
                remainingErrors === 1
                  ? ''
                  : 's'
              } left.`,
        );
      }
    },
    [
      difficulty,
      errorCount,
      saveStepResult,
      userConfig.quantity,
      isSpanish,
      onMistake,
    ],
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
  } = useMovementMission(
    config,
    handleStepResult,
  );

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];

  const currentStep =
    config.steps[currentStepIndex];

  const isSmall =
    width < 360;

  const isShort =
    height < 680;

  const ringSize =
    isSmall
      ? 132
      : isShort
        ? 140
        : 154;

  const displayAlarmLabel =
    alarmLabel ??
    (
      isSpanish
        ? 'Hora de levantarse'
        : 'Time to wake up'
    );

  const handleStart =
    React.useCallback(() => {
      if (feedbackType !== 'warning') {
        setFeedbackMessage('');
      }

      start();
    }, [
      feedbackType,
      start,
    ]);

  const handleCompleteMission =
    React.useCallback(() => {
      onSuccess({
        durationMs: result?.durationMs ?? 0,
      });
    }, [
      onSuccess,
      result?.durationMs,
    ]);

  if (
    capabilities &&
    incompatible
  ) {
    return (
      <CenteredState>
        <Text
          style={[
            styles.stateIcon,
            {
              color: colors.text,
            },
          ]}
        >
          SENSOR
        </Text>

        <Text
          style={[
            styles.stateTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Dispositivo no compatible'
            : 'Device not compatible'}
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
            ? 'Esta misión necesita acelerómetro o giroscopio para validar el movimiento.'
            : 'This mission needs an accelerometer or gyroscope to validate movement.'}
        </Text>
      </CenteredState>
    );
  }

  if (phase === 'success') {
    return (
      <CenteredState>
        <MissionCompleteModal
          visible
          completedCount={config.steps.length}
          totalCount={config.steps.length}
          onContinue={handleCompleteMission}
        />

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
            ? 'Misión completada'
            : 'Mission completed'}
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
            ? `${config.steps.length} movimientos correctos.`
            : `${config.steps.length} correct movements.`}
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

  const instructionText =
    phase === 'idle'
      ? isSpanish
        ? 'Realiza el movimiento:'
        : 'Perform the movement:'
      : translateMovementText(
          currentStep?.instruction ??
            (
              isSpanish
                ? 'Realiza el movimiento:'
                : 'Perform the movement:'
            ),
          isSpanish,
        );

  const startButtonText =
    currentStepIndex > 0 ||
    config.steps.some((step) => step.completed)
      ? isSpanish
        ? `Comenzar paso ${currentStepIndex + 1}`
        : `Start step ${currentStepIndex + 1}`
      : isSpanish
        ? 'Comenzar'
        : 'Start';

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
            {displayAlarmLabel}
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
            {instructionText}
          </Text>

          {phase === 'countdown' ? (
            <View
              style={[
                styles.countdown,
                {
                  backgroundColor:
                    colors.bgCard,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.countdownNumber,
                  {
                    color:
                      difficultyStyle.accentColor,
                  },
                ]}
              >
                {countdown}
              </Text>

              <Text
                style={[
                  styles.hint,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {isSpanish
                  ? 'Prepárate...'
                  : 'Get ready...'}
              </Text>
            </View>
          ) : currentStep ? (
            <View
              style={[
                styles.missionBox,
                {
                  backgroundColor:
                    colors.bgCard,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <StepRing
                progress={stepProgress}
                color={
                  difficultyStyle.accentColor
                }
                backgroundColor={colors.bgCard}
                trackColor={colors.border}
                imageSource={
                  MOVEMENT_IMAGES[
                    currentStep.type
                  ]
                }
                size={ringSize}
              />

              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {translateMovementText(
                  currentStep.label,
                  isSpanish,
                )}
              </Text>

              <Text
                style={[
                  styles.stepDetail,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {translateMovementText(
                  currentStep.detail,
                  isSpanish,
                )}
              </Text>

              <View style={styles.sensorBlock}>
                <SensorBar
                  magnitude={currentMagnitude}
                  color={
                    difficultyStyle.accentColor
                  }
                  trackColor={colors.border}
                  maxMagnitude={30}
                />

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
                  {isSpanish
                    ? `Validación ${Math.round(
                        Math.min(
                          detectionRatio,
                          1,
                        ) * 100,
                      )}%`
                    : `Validation ${Math.round(
                        Math.min(
                          detectionRatio,
                          1,
                        ) * 100,
                      )}%`}
                </Text>
              </View>

              <Text
                style={[
                  styles.stepCounter,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {isSpanish
                  ? `Paso ${Math.min(
                      currentStepIndex + 1,
                      config.steps.length,
                    )} / ${config.steps.length}`
                  : `Step ${Math.min(
                      currentStepIndex + 1,
                      config.steps.length,
                    )} / ${config.steps.length}`}
              </Text>
            </View>
          ) : null}

          {phase === 'idle' ? (
            <>
              {showStepError ||
              feedbackMessage ? (
                <Text
                  style={[
                    styles.feedbackText,
                    {
                      color: feedbackColor,
                    },
                  ]}
                >
                  {feedbackMessage ||
                    (
                      isSpanish
                        ? 'Movimiento no validado, intenta de nuevo'
                        : 'Movement not validated, try again'
                    )}
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
                onPress={handleStart}
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
                  {startButtonText}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
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
