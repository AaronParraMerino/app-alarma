import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MovementMissionConfig, MovementMissionUserConfig } from '../types/movement.types';
import { buildMovementMissionConfig } from '../services/movementMissionBuilder';
import { useMovementMission } from '../hooks/useMovementMission';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../constants/movementConstants';
import { StepRing } from '../components/StepRing';
import { SensorBar } from '../components/SensorBar';

interface MovementMissionScreenProps {
  userConfig: MovementMissionUserConfig;
  onSuccess: (result: { durationMs: number }) => void;
  onReplace?: () => void;
  replacesLeft?: number;
  alarmLabel?: string;
  currentTime?: string;
}

export function MovementMissionScreen({
  userConfig,
  onSuccess,
  onReplace,
  replacesLeft = 0,
  alarmLabel = 'Hora de levantarse',
  currentTime = '',
}: MovementMissionScreenProps) {
  // Build config once
  const [config] = React.useState<MovementMissionConfig>(() =>
    buildMovementMissionConfig(userConfig),
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
    start,
    retry,
  } = useMovementMission(config);

  const color = DIFFICULTY_COLORS[userConfig.difficulty];
  const currentStep = config.steps[currentStepIndex];

  // Notify parent on success
  useEffect(() => {
    if (phase === 'success' && result) {
      const timeout = setTimeout(() => onSuccess({ durationMs: result.durationMs }), 1200);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  // ── Loading / checking sensors ─────────────────────────────────────────────
  if (!capabilities) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color} size="large" />
        <Text style={styles.loadingText}>Verificando sensores...</Text>
      </View>
    );
  }

  // ── Incompatible device ────────────────────────────────────────────────────
  if (incompatible) {
    return (
      <View style={styles.centered}>
        <Text style={styles.incompatibleIcon}>📵</Text>
        <Text style={styles.incompatibleTitle}>Dispositivo no compatible</Text>
        <Text style={styles.incompatibleDesc}>
          Tu dispositivo no tiene acelerómetro ni giroscopio.{'\n'}
          No es posible ejecutar la misión de movimiento.
        </Text>
        {onReplace && replacesLeft > 0 && (
          <TouchableOpacity style={[styles.replaceBtn, { borderColor: color }]} onPress={onReplace}>
            <Text style={[styles.replaceBtnText, { color }]}>
              Cambiar misión ({replacesLeft} restantes)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <View style={[styles.centered, { backgroundColor: '#000' }]}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={[styles.successTitle, { color }]}>¡Misión completada!</Text>
        <Text style={styles.successSub}>
          {config.steps.length} {config.steps.length === 1 ? 'movimiento' : 'movimientos'} completados
        </Text>
      </View>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (phase === 'failed') {
    return (
      <View style={styles.centered}>
        <Text style={styles.failIcon}>❌</Text>
        <Text style={styles.failTitle}>No se detectó movimiento</Text>
        <Text style={styles.failDesc}>
          Muévete más para completar la misión.
        </Text>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: color, marginTop: 24 }]}
          onPress={retry}
        >
          <Text style={styles.confirmBtnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main screen ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Difficulty badge + time */}
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{DIFFICULTY_LABELS[userConfig.difficulty].toUpperCase()}</Text>
      </View>

      <Text style={styles.clock}>{currentTime}</Text>
      <Text style={styles.alarmLabel}>{alarmLabel}</Text>

      <View style={styles.divider} />

      {/* Step list (medium/hard shows all; easy shows single) */}
      {config.steps.length > 1 && (
        <View style={styles.stepList}>
          {config.steps.map((step, i) => {
            const isActive = i === currentStepIndex && phase === 'running';
            const isDone = i < currentStepIndex;
            const isPending = i > currentStepIndex;
            return (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  isActive && { opacity: 1 },
                  isPending && { opacity: 0.35 },
                ]}
              >
                <Text style={[styles.stepIndexLabel, isActive && { color }]}>
                  {i + 1} — {isDone ? 'listo ✓' : isActive ? 'en curso' : 'pendiente'}
                </Text>
                <Text style={styles.stepRowLabel}>
                  {step.icon}  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Main step display */}
      {phase === 'countdown' ? (
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdownNumber, { color }]}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Prepárate...</Text>
        </View>
      ) : (
        <View style={styles.missionCenter}>
          {currentStep && (
            <>
              <StepRing
                progress={stepProgress}
                color={color}
                icon={currentStep.icon}
                size={160}
              />
              <Text style={styles.stepInstruction}>{currentStep.label}</Text>

              {/* Sensor feedback bar */}
              <View style={styles.sensorBarContainer}>
                <SensorBar
                  magnitude={currentMagnitude}
                  color={color}
                  maxMagnitude={30}
                />
                <Text style={styles.sensorHint}>
                  {currentMagnitude > currentStep.threshold
                    ? '✓ Movimiento detectado'
                    : 'Esperando movimiento...'}
                </Text>
              </View>

              {config.steps.length > 1 && (
                <Text style={styles.stepCounter}>
                  Paso {currentStepIndex + 1} / {config.steps.length}
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {/* Start button (idle only) */}
      {phase === 'idle' && (
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: color }]}
          onPress={start}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Iniciar misión</Text>
        </TouchableOpacity>
      )}

      {/* Replace mission */}
      {onReplace && replacesLeft > 0 && phase === 'idle' && (
        <TouchableOpacity style={styles.replaceLink} onPress={onReplace}>
          <Text style={styles.replaceLinkText}>
            Reemplazar misión {replacesLeft}/3
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  clock: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: -2,
  },
  alarmLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
  },
  stepList: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  stepRow: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
  },
  stepIndexLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepRowLabel: {
    color: '#ddd',
    fontSize: 15,
    fontWeight: '500',
  },
  missionCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  stepInstruction: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  sensorBarContainer: {
    width: '80%',
    gap: 6,
    alignItems: 'center',
  },
  sensorHint: {
    color: '#555',
    fontSize: 12,
  },
  stepCounter: {
    color: '#444',
    fontSize: 13,
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '200',
    lineHeight: 130,
  },
  countdownLabel: {
    color: '#555',
    fontSize: 16,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  replaceLink: {
    paddingVertical: 8,
  },
  replaceLinkText: {
    color: '#555',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  loadingText: {
    color: '#555',
    fontSize: 14,
    marginTop: 16,
  },
  incompatibleIcon: { fontSize: 56, marginBottom: 16 },
  incompatibleTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  incompatibleDesc: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  replaceBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  replaceBtnText: { fontSize: 14, fontWeight: '600' },
  successIcon: { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  successSub: { color: '#555', fontSize: 15 },
  failIcon: { fontSize: 56, marginBottom: 16 },
  failTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  failDesc: { color: '#666', fontSize: 14, textAlign: 'center' },
});
