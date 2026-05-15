import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MovementMissionConfig, MovementMissionUserConfig } from '../types/movement.types';
import { buildMovementMissionConfig } from '../services/movementMissionBuilder';
import {
  MovementStepResultEvent,
  useMovementMission,
} from '../hooks/useMovementMission';
import { DIFFICULTY_STYLES } from '../constants/movementConstants';
import { SensorBar } from '../components/SensorBar';
import { StepRing } from '../components/StepRing';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAuth } from '../../../auth/hooks/useAuth';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';

interface MovementMissionScreenProps {
  userConfig: MovementMissionUserConfig;
  onSuccess: (result: { durationMs: number }) => void;
  onReplace?: () => void;
  replacesLeft?: number;
  alarmLabel?: string;
}

export function MovementMissionScreen({
  userConfig,
  onSuccess,
  onReplace,
  replacesLeft = 0,
  alarmLabel = 'Hora de levantarse',
}: MovementMissionScreenProps) {
  const { width, height } = useWindowDimensions();
  const { time, day } = useCurrentTime();
  const { user, isAuthenticated, isGuest } = useAuth();
  const savedStepResultIds = React.useRef<Set<string>>(new Set());
  const [config] = React.useState<MovementMissionConfig>(() =>
    buildMovementMissionConfig(userConfig),
  );

  // Guarda cada submision solo para usuarios registrados
  const saveStepResult = React.useCallback((stepResult: MovementStepResultEvent) => {
    if (!isAuthenticated || isGuest || !user?.id) {
      console.log('[MovementMission history] skipped', {
        isAuthenticated,
        isGuest,
        hasUserId: Boolean(user?.id),
        step: stepResult.stepIndex + 1,
        success: stepResult.success,
      });
      return;
    }

    if (savedStepResultIds.current.has(stepResult.id)) return;
    savedStepResultIds.current.add(stepResult.id);

    try {
      const syncId = MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'movement',
        difficulty: userConfig.difficulty,
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

      console.log('[MovementMission history] saved locally', {
        syncId,
        step: stepResult.stepIndex + 1,
        success: stepResult.success,
      });

      void syncMissionHistory(user.id);
    } catch (error) {
      savedStepResultIds.current.delete(stepResult.id);
      console.error('[MovementMission history] save failed:', error);
    }
  }, [
    isAuthenticated,
    isGuest,
    user?.id,
    userConfig.difficulty,
  ]);

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
  } = useMovementMission(config, saveStepResult);

  const style = DIFFICULTY_STYLES[userConfig.difficulty];
  const currentStep = config.steps[currentStepIndex];
  const isSmall = width < 360;
  const isShort = height < 680;
  const ringSize = isSmall ? 132 : isShort ? 140 : 154;
  const displayAlarmLabel = !alarmLabel || alarmLabel === 'Alarma'
    ? 'Hora de levantarse'
    : alarmLabel;

  // Al completar todo, espera un momento para mostrar el estado final
  useEffect(() => {
    if (phase === 'success' && result) {
      const timeout = setTimeout(() => onSuccess({ durationMs: result.durationMs }), 900);
      return () => clearTimeout(timeout);
    }
  }, [onSuccess, phase, result]);

  // Estado visible solo si el dispositivo no tiene sensores compatibles
  if (capabilities && incompatible) {
    return (
      <CenteredState color={style.accentColor}>
        <Text style={styles.stateIcon}>SENSOR</Text>
        <Text style={styles.stateTitle}>Dispositivo no compatible</Text>
        <Text style={styles.stateText}>
          Esta mision necesita acelerometro o giroscopio para validar el movimiento.
        </Text>
        <ReplaceAction color={style.accentColor} onReplace={onReplace} replacesLeft={replacesLeft} />
      </CenteredState>
    );
  }

  // Pantalla corta antes de volver al flujo de alarma.
  if (phase === 'success') {
    return (
      <CenteredState color={style.accentColor}>
        <Text style={[styles.stateIcon, { color: style.accentColor }]}>OK</Text>
        <Text style={[styles.stateTitle, { color: style.accentColor }]}>
          Mision completada
        </Text>
        <Text style={styles.stateText}>
          {config.steps.length} movimientos correctos.
        </Text>
      </CenteredState>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={[styles.pill, { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' }]}>
          <Text style={[styles.pillText, { color: style.accentColor }]}>{style.label}</Text>
        </View>

        <View style={styles.timeBlock}>
          <Text style={[styles.time, { fontSize: width < 380 ? 44 : 52 }]}>
            {time}
          </Text>
          <Text style={styles.dateLabel}>{day} - {displayAlarmLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <Text style={styles.instruction}>
            {phase === 'idle'
              ? 'Realiza el movimiento:'
              : currentStep?.instruction ?? 'Realiza el movimiento:'}
          </Text>

          <View style={styles.sequence}>
            {config.steps.map((step, index) => {
              const active = index === currentStepIndex;
              const done = index < currentStepIndex || step.completed;

              return (
                <View
                  key={step.id}
                  style={[
                    styles.sequenceDot,
                    {
                      borderColor: active || done ? style.accentColor : '#334455',
                      backgroundColor: done ? style.accentColor : '#161616',
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                    style={[
                      styles.sequenceText,
                      { color: done ? style.textColor : active ? style.accentColor : '#667788' },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              );
            })}
          </View>

          {phase === 'countdown' ? (
            <View style={styles.countdown}>
              <Text style={[styles.countdownNumber, { color: style.accentColor }]}>
                {countdown}
              </Text>
              <Text style={styles.hint}>Preparate...</Text>
            </View>
          ) : currentStep ? (
            <View style={styles.missionBox}>
              <StepRing
                progress={stepProgress}
                color={style.accentColor}
                icon={currentStep.icon}
                size={ringSize}
              />

              <Text style={styles.stepTitle}>{currentStep.label}</Text>
              <Text style={styles.stepDetail}>{currentStep.detail}</Text>

              <View style={styles.sensorBlock}>
                <SensorBar
                  magnitude={currentMagnitude}
                  color={style.accentColor}
                  maxMagnitude={30}
                />
                <Text style={[styles.hint, { color: style.accentColor + '88' }]}>
                  Validacion {Math.round(Math.min(detectionRatio, 1) * 100)}%
                </Text>
              </View>

              <Text style={styles.stepCounter}>
                Paso {Math.min(currentStepIndex + 1, config.steps.length)} / {config.steps.length}
              </Text>
            </View>
          ) : null}

          {phase === 'idle' && (
            <>
              {showStepError && (
                <Text style={styles.errorText}>Movimiento no validado, intenta de nuevo</Text>
              )}

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
              onPress={start}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, { color: style.textColor }]}>
                {currentStepIndex > 0 || config.steps.some(step => step.completed)
                  ? `Comenzar paso ${currentStepIndex + 1}`
                  : 'Comenzar'}
              </Text>
            </TouchableOpacity>
            </>
          )}

          {onReplace && replacesLeft > 0 && phase === 'idle' && (
            <TouchableOpacity style={styles.replaceLink} onPress={onReplace}>
              <Text style={styles.replaceLinkText}>
                Reemplazar mision {replacesLeft}/3
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function CenteredState({
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>{children}</View>
    </SafeAreaView>
  );
}

function ReplaceAction({
  color,
  onReplace,
  replacesLeft,
}: {
  color: string;
  onReplace?: () => void;
  replacesLeft: number;
}) {
  if (!onReplace || replacesLeft <= 0) return null;

  return (
    <TouchableOpacity style={[styles.replaceBtn, { borderColor: color }]} onPress={onReplace}>
      <Text style={[styles.replaceBtnText, { color }]}>
        Cambiar mision ({replacesLeft} restantes)
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  screen: {
    flex: 1,
    backgroundColor: '#0D0D0D',
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
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: { fontWeight: '500', color: '#FFFFFF', letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, color: '#556677', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginHorizontal: 16, marginVertical: 10 },
  body: { flex: 1, paddingHorizontal: 18, paddingBottom: 16 },
  instruction: { fontSize: 12, color: '#667788', marginBottom: 12 },
  errorText: { fontSize: 11, color: '#F87171', textAlign: 'center', marginBottom: 8 },
  sequence: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sequenceDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceText: { fontSize: 12, fontWeight: '700' },
  missionBox: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },
  stepDetail: {
    color: '#667788',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  sensorBlock: { width: '86%', alignItems: 'center', gap: 6 },
  stepCounter: { color: '#556677', fontSize: 12, marginTop: 10 },
  countdown: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: { fontSize: 104, fontWeight: '200', lineHeight: 112 },
  hint: { fontSize: 11, textAlign: 'center', color: '#667788' },
  confirmBtn: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  confirmText: { fontSize: 15, fontWeight: '500' },
  replaceLink: { paddingVertical: 8, alignItems: 'center' },
  replaceLinkText: { color: '#556677', fontSize: 13, textDecorationLine: 'underline' },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateIcon: {
    color: '#E0E7FF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  stateTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateText: { color: '#667788', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  replaceBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  replaceBtnText: { fontSize: 14, fontWeight: '600' },
});
