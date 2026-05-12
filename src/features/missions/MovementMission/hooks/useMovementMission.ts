import { useCallback, useEffect, useRef, useState } from 'react';
import { MovementMissionConfig, MovementMissionResult, SensorCapabilities } from '../types/movement.types';
import {
  checkSensorCapabilities,
  requestSensorPermissions,
  subscribeToMovement,
  SensorUnsubscribe,
} from '../services/sensorService';

type MissionPhase = 'idle' | 'countdown' | 'running' | 'step_success' | 'failed' | 'success';

interface UseMovementMissionState {
  phase: MissionPhase;
  currentStepIndex: number;
  stepProgress: number;       // 0–1 for current step sustained duration
  countdown: number;          // 3–2–1 before start
  elapsedMs: number;
  capabilities: SensorCapabilities | null;
  incompatible: boolean;
  result: MovementMissionResult | null;
  currentMagnitude: number;   // live sensor magnitude (for visual feedback)
}

export function useMovementMission(config: MovementMissionConfig) {
  const [state, setState] = useState<UseMovementMissionState>({
    phase: 'idle',
    currentStepIndex: 0,
    stepProgress: 0,
    countdown: 3,
    elapsedMs: 0,
    capabilities: null,
    incompatible: false,
    result: null,
    currentMagnitude: 0,
  });

  const sensorUnsub = useRef<SensorUnsubscribe | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const stepStartRef = useRef<number>(0);
  const continuityFailRef = useRef<boolean>(false);
  const detectedRef = useRef<boolean>(false);

  // ── Init: check sensors ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await requestSensorPermissions();
      const caps = await checkSensorCapabilities();
      const incompatible = !caps.hasAccelerometer && !caps.hasGyroscope;
      setState(s => ({ ...s, capabilities: caps, incompatible }));
    })();
    return () => cleanup();
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  function cleanup() {
    sensorUnsub.current?.();
    sensorUnsub.current = null;
    if (stepTimer.current) clearInterval(stepTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }

  // ── Start: countdown then run ──────────────────────────────────────────────
  const start = useCallback(() => {
    setState(s => ({ ...s, phase: 'countdown', countdown: 3 }));
    let count = 3;
    countdownTimer.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownTimer.current!);
        startTimeRef.current = Date.now();
        setState(s => ({ ...s, phase: 'running', countdown: 0, currentStepIndex: 0 }));
        beginStep(0);
      } else {
        setState(s => ({ ...s, countdown: count }));
      }
    }, 1000);
  }, []);

  // ── Begin a step ──────────────────────────────────────────────────────────
  const beginStep = useCallback((stepIndex: number) => {
    if (stepIndex >= config.steps.length) {
      finishMission(true);
      return;
    }

    const step = config.steps[stepIndex];
    stepStartRef.current = Date.now();
    continuityFailRef.current = false;
    detectedRef.current = false;

    // Subscribe to sensor for this step
    sensorUnsub.current?.();
    sensorUnsub.current = subscribeToMovement(step.type, ({ detected, magnitude }) => {
      detectedRef.current = detected;
      setState(s => ({ ...s, currentMagnitude: magnitude }));

      // Medium/hard: if user stops, mark continuity fail
      if (config.requiresContinuity && !detected) {
        continuityFailRef.current = true;
      }
    });

    // Poll progress every 200ms
    let elapsed = 0;
    stepTimer.current = setInterval(() => {
      elapsed += 0.2;
      const progress = Math.min(elapsed / step.durationSeconds, 1);

      setState(s => ({
        ...s,
        stepProgress: progress,
        elapsedMs: Date.now() - startTimeRef.current,
      }));

      // If sensor not detected at all in first 5s on medium/hard, fail
      if (elapsed >= 5 && !detectedRef.current && config.requiresContinuity) {
        clearInterval(stepTimer.current!);
        sensorUnsub.current?.();
        finishMission(false);
        return;
      }

      if (elapsed >= step.durationSeconds) {
        clearInterval(stepTimer.current!);
        sensorUnsub.current?.();

        if (detectedRef.current) {
          // Step success
          setState(s => ({ ...s, phase: 'step_success', stepProgress: 1 }));
          setTimeout(() => {
            const next = stepIndex + 1;
            setState(s => ({ ...s, currentStepIndex: next, phase: 'running', stepProgress: 0 }));
            beginStep(next);
          }, 800);
        } else {
          // No movement detected — fail
          finishMission(false);
        }
      }
    }, 200);
  }, [config]);

  // ── Finish ────────────────────────────────────────────────────────────────
  function finishMission(success: boolean) {
    cleanup();
    const completedSteps = config.steps.filter(s => s.completed).length;
    const result: MovementMissionResult = {
      success,
      completedSteps: success ? config.steps.length : completedSteps,
      totalSteps: config.steps.length,
      durationMs: Date.now() - startTimeRef.current,
    };
    setState(s => ({ ...s, phase: success ? 'success' : 'failed', result }));
  }

  const retry = useCallback(() => {
    cleanup();
    setState(s => ({
      ...s,
      phase: 'idle',
      currentStepIndex: 0,
      stepProgress: 0,
      countdown: 3,
      elapsedMs: 0,
      result: null,
      currentMagnitude: 0,
    }));
  }, []);

  return {
    ...state,
    start,
    retry,
  };
}