import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MovementMissionConfig,
  MovementMissionResult,
  SensorCapabilities,
} from '../types/movement.types';
import {
  checkSensorCapabilities,
  requestSensorPermissions,
  SensorReading,
  SensorUnsubscribe,
  subscribeToMovement,
} from '../services/sensorService';

type MissionPhase = 'idle' | 'countdown' | 'running' | 'step_success' | 'failed' | 'success';

type MovementSensorReading = SensorReading & {
  failed?: boolean;
  reason?: string;
};

export interface MovementStepResultEvent {
  id: string;
  stepIndex: number;
  totalSteps: number;
  type: string;
  label: string;
  success: boolean;
  errorReason?: string;
  durationSeconds: number | null;
}

interface UseMovementMissionState {
  phase: MissionPhase;
  currentStepIndex: number;
  stepProgress: number;
  countdown: number;
  elapsedMs: number;
  capabilities: SensorCapabilities | null;
  incompatible: boolean;
  permissionDenied: boolean;
  result: MovementMissionResult | null;
  currentMagnitude: number;
  detectionRatio: number;
  showStepError: boolean;
  lastStepResult: MovementStepResultEvent | null;
}

const EMPTY_RESULT: MovementMissionResult = {
  success: false,
  completedSteps: 0,
  totalSteps: 0,
  durationMs: 0,
};

// Controla el flujo completo de la mision de movimiento
export function useMovementMission(
  config: MovementMissionConfig,
  onStepResult?: (result: MovementStepResultEvent) => void,
) {
  const [state, setState] = useState<UseMovementMissionState>({
    phase: 'idle',
    currentStepIndex: 0,
    stepProgress: 0,
    countdown: 3,
    elapsedMs: 0,
    capabilities: null,
    incompatible: false,
    permissionDenied: false,
    result: null,
    currentMagnitude: 0,
    detectionRatio: 0,
    showStepError: false,
    lastStepResult: null,
  });

  const sensorUnsub = useRef<SensorUnsubscribe | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const stepStartTimeRef = useRef(0);
  const validSamplesRef = useRef(0);
  const totalSamplesRef = useRef(0);
  const sensorProgressRef = useRef(0);
  const activeStepIndexRef = useRef(0);

  // Detiene sensores y temporizadores activos
  const cleanup = useCallback(() => {
    sensorUnsub.current?.();
    sensorUnsub.current = null;

    if (stepTimer.current) {
      clearInterval(stepTimer.current);
      stepTimer.current = null;
    }

    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  useEffect(() => {
    cleanup();
    setState(s => ({
      phase: 'idle',
      currentStepIndex: 0,
      stepProgress: 0,
      countdown: 3,
      elapsedMs: 0,
      capabilities: s.capabilities,
      incompatible: s.incompatible,
      permissionDenied: s.permissionDenied,
      result: null,
      currentMagnitude: 0,
      detectionRatio: 0,
      showStepError: false,
      lastStepResult: null,
    }));
  }, [cleanup, config]);

  // Limpia el aviso corto de fallo del paso
  const clearStepErrorTimer = useCallback(() => {
    if (stepErrorTimer.current) {
      clearTimeout(stepErrorTimer.current);
      stepErrorTimer.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Revisa permisos y compatibilidad sin bloquear la pantalla inicial
    async function init() {
      const permissionGranted = await requestSensorPermissions();
      const caps = await checkSensorCapabilities();
      const incompatible = !caps.hasAccelerometer && !caps.hasGyroscope;

      if (!mounted) return;
      setState(s => ({
        ...s,
        capabilities: caps,
        incompatible,
        permissionDenied: !permissionGranted,
      }));
    }

    void init();

    return () => {
      mounted = false;
      clearStepErrorTimer();
      cleanup();
    };
  }, [clearStepErrorTimer, cleanup]);

  // Cierra la mision y arma el resultado final.
  const finishMission = useCallback((success: boolean) => {
    cleanup();

    const completedSteps = config.steps.filter(step => step.completed).length;
    const result: MovementMissionResult = {
      ...EMPTY_RESULT,
      success,
      completedSteps: success ? config.steps.length : completedSteps,
      totalSteps: config.steps.length,
      durationMs: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
    };

    setState(s => ({
      ...s,
      phase: success ? 'success' : 'failed',
      result,
    }));
  }, [cleanup, config.steps]);

  // Falla solo el paso actual y lo deja listo para comenzar de nuevo
  const failCurrentStep = useCallback((stepIndex: number) => {
    cleanup();
    clearStepErrorTimer();
    activeStepIndexRef.current = stepIndex;
    const failedStep = config.steps[stepIndex];
    failedStep.completed = false;
    const durationSeconds = stepStartTimeRef.current
      ? Math.round((Date.now() - stepStartTimeRef.current) / 1000)
      : null;

    const stepResult: MovementStepResultEvent = {
      id: `${failedStep.id}_fail_${Date.now()}`,
      stepIndex,
      totalSteps: config.steps.length,
      type: failedStep.type,
      label: failedStep.label,
      success: false,
      errorReason: 'movement_not_validated',
      durationSeconds,
    };

    onStepResult?.(stepResult);

    setState(s => ({
      ...s,
      phase: 'idle',
      currentStepIndex: stepIndex,
      stepProgress: 0,
      countdown: 3,
      result: null,
      currentMagnitude: 0,
      detectionRatio: 0,
      showStepError: true,
      lastStepResult: stepResult,
    }));

    stepErrorTimer.current = setTimeout(() => {
      setState(s => ({ ...s, showStepError: false }));
      stepErrorTimer.current = null;
    }, 1300);
  }, [clearStepErrorTimer, cleanup, config.steps, onStepResult]);

  // Inicia la validacion del paso indicado
  const beginStep = useCallback((stepIndex: number) => {
    if (stepIndex >= config.steps.length) {
      finishMission(true);
      return;
    }

    const step = config.steps[stepIndex];
    const isWalkStep = step.type === 'walk';

    let stepFinished = false;

    activeStepIndexRef.current = stepIndex;
    stepStartTimeRef.current = Date.now();
    validSamplesRef.current = 0;
    totalSamplesRef.current = 0;
    sensorProgressRef.current = 0;

    // Marca el paso como correcto y prepara el siguiente
    const markStepSuccess = () => {
      if (stepFinished) return;

      stepFinished = true;

      sensorUnsub.current?.();
      sensorUnsub.current = null;

      if (stepTimer.current) {
        clearInterval(stepTimer.current);
        stepTimer.current = null;
      }

      config.steps[stepIndex].completed = true;
      const durationSeconds = stepStartTimeRef.current
        ? Math.round((Date.now() - stepStartTimeRef.current) / 1000)
        : null;

      const stepResult: MovementStepResultEvent = {
        id: `${step.id}_success_${Date.now()}`,
        stepIndex,
        totalSteps: config.steps.length,
        type: step.type,
        label: step.label,
        success: true,
        durationSeconds,
      };

      onStepResult?.(stepResult);

      setState(s => ({
        ...s,
        phase: 'step_success',
        stepProgress: 1,
        lastStepResult: stepResult,
      }));

      setTimeout(() => {
        const nextStepIndex = stepIndex + 1;

        if (nextStepIndex >= config.steps.length) {
          finishMission(true);
          return;
        }

        activeStepIndexRef.current = nextStepIndex;
        setState(s => ({
          ...s,
          currentStepIndex: nextStepIndex,
          phase: 'idle',
          stepProgress: 0,
          countdown: 3,
          result: null,
          currentMagnitude: 0,
          detectionRatio: 0,
          elapsedMs: Date.now() - startTimeRef.current,
        }));
      }, 650);
    };

    // Escucha el sensor correspondiente al movimiento actual
    sensorUnsub.current?.();
    sensorUnsub.current = subscribeToMovement(step.type, (reading: MovementSensorReading) => {
      if (stepFinished) return;

      totalSamplesRef.current += 1;

      if (reading.detected) {
        validSamplesRef.current += 1;
      }

      sensorProgressRef.current = Math.max(
        sensorProgressRef.current,
        reading.progress ?? 0,
      );

      const ratio = totalSamplesRef.current > 0
        ? validSamplesRef.current / totalSamplesRef.current
        : 0;

      const progress = reading.progress ?? ratio;

      setState(s => ({
        ...s,
        currentMagnitude: reading.magnitude,
        detectionRatio: progress,
        stepProgress: isWalkStep ? progress : s.stepProgress,
        elapsedMs: Date.now() - startTimeRef.current,
      }));

      /*
        Para walk, el sensorService controla el fallo:
        - acumula tiempo caminando
        - conserva progreso al detenerse
        - falla solo si pasan más de 3 segundos sin caminar
      */
      if (isWalkStep && reading.failed) {
        stepFinished = true;
        failCurrentStep(stepIndex);
        return;
      }

      /*
        Para walk, no esperamos a durationSeconds
        Completa apenas el progreso acumulado llega a 100%
      */
      if (isWalkStep && reading.detected) {
        markStepSuccess();
      }
    }, step.threshold);

    let elapsed = 0;
    stepTimer.current = setInterval(() => {
      if (stepFinished) return;

      elapsed += 0.2;

      const ratio = totalSamplesRef.current > 0
        ? validSamplesRef.current / totalSamplesRef.current
        : 0;

      const timeProgress = Math.min(elapsed / step.durationSeconds, 1);
      const validationProgress = sensorProgressRef.current > 0
        ? sensorProgressRef.current
        : Math.min(ratio / step.requiredRatio, 1);

      setState(s => ({
        ...s,
        stepProgress: isWalkStep
          ? sensorProgressRef.current
          : Math.min(timeProgress, validationProgress),
        elapsedMs: Date.now() - startTimeRef.current,
      }));

      /*
        Esta regla no  aplica a walk
        Walk ya falla desde sensorService con reading.failed cuando pasan 3s sin caminar
      */
      if (
        !isWalkStep &&
        elapsed >= 5 &&
        config.requiresContinuity &&
        validSamplesRef.current === 0
      ) {
        stepFinished = true;
        failCurrentStep(stepIndex);
        return;
      }

      /*
        Esta regla no aplica a walk
        Walk ya no tiene tiempo total máximo; usa tiempo acumulado caminando
      */
      if (!isWalkStep && elapsed >= step.durationSeconds) {
        const finalRatio = totalSamplesRef.current > 0
          ? validSamplesRef.current / totalSamplesRef.current
          : 0;

        const isComplete = sensorProgressRef.current > 0
          ? sensorProgressRef.current >= 1
          : finalRatio >= step.requiredRatio;

        if (!isComplete) {
          stepFinished = true;
          failCurrentStep(stepIndex);
          return;
        }

        markStepSuccess();
      }
    }, 200);
  }, [config, failCurrentStep, finishMission, onStepResult]);

  // Muestra conteo y comienza el paso actual, no reinicia pasos aprobados
  const start = useCallback(() => {
    if (state.incompatible) return;

    const startStepIndex = Math.min(state.currentStepIndex, config.steps.length - 1);
    const isFreshStart = startStepIndex === 0 && !config.steps.some(step => step.completed);

    cleanup();
    clearStepErrorTimer();

    if (isFreshStart) {
      config.steps.forEach(step => {
        step.completed = false;
      });
      startTimeRef.current = 0;
    }

    setState(s => ({
      ...s,
      phase: 'countdown',
      countdown: 3,
      currentStepIndex: startStepIndex,
      stepProgress: 0,
      elapsedMs: isFreshStart ? 0 : s.elapsedMs,
      result: null,
      currentMagnitude: 0,
      detectionRatio: 0,
      showStepError: false,
    }));

    let count = 3;

    countdownTimer.current = setInterval(() => {
      count -= 1;

      if (count <= 0) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }

        if (!startTimeRef.current) {
          startTimeRef.current = Date.now();
        }
        setState(s => ({
          ...s,
          phase: 'running',
          countdown: 0,
          currentStepIndex: startStepIndex,
          stepProgress: 0,
          detectionRatio: 0,
        }));
        beginStep(startStepIndex);
        return;
      }

      setState(s => ({ ...s, countdown: count }));
    }, 1000);
  }, [beginStep, clearStepErrorTimer, cleanup, config.steps, state.currentStepIndex, state.incompatible]);

  return {
    ...state,
    start,
  };
}
