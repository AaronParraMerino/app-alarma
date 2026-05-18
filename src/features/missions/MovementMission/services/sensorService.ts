import { Accelerometer, Gyroscope, Pedometer } from "expo-sensors";
import { SensorCapabilities, MovementType } from "../types/movement.types";
import { MOVEMENT_THRESHOLDS } from "../constants/movementConstants";

export type SensorUnsubscribe = () => void;

export interface SensorReading {
  magnitude: number;
  detected: boolean;
  progress?: number;
  failed?: boolean;
  reason?: string;
}

// Revisa que sensores existen en el dispositivo.
export async function checkSensorCapabilities(): Promise<SensorCapabilities> {
  const [accel, gyro, pedo] = await Promise.all([
    Accelerometer.isAvailableAsync().catch(() => false),
    Gyroscope.isAvailableAsync().catch(() => false),
    Pedometer.isAvailableAsync().catch(() => false),
  ]);

  return {
    hasAccelerometer: Boolean(accel),
    hasGyroscope: Boolean(gyro),
    hasPedometer: Boolean(pedo),
  };
}

// Pide permisos necesarios y permite fallback si pedometer no esta listo.
export async function requestSensorPermissions(): Promise<boolean> {
  try {
    const pedometerAvailable = await Pedometer.isAvailableAsync().catch(() => false);

    if (!pedometerAvailable) {
      return true;
    }

    const { status } = await Pedometer.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    return true;
  }
}

// Conecta cada tipo de movimiento con su detector.
export function subscribeToMovement(
  type: MovementType,
  onDetected: (reading: SensorReading) => void,
  thresholdOverride?: number,
): SensorUnsubscribe {
  const threshold = thresholdOverride ?? MOVEMENT_THRESHOLDS[type];

  if (type === "walk") {
    return subscribeToWalk(threshold, onDetected);
  }

  if (type === "tilt") {
    return subscribeToTilt(threshold, onDetected);
  }

  if (type === "shake") {
    return subscribeToShake(threshold, onDetected);
  }

  if (type === "rotate") {
    return subscribeToRotate(threshold, onDetected);
  }

  return () => {};
}

// Detecta una sacudida fuerte con acelerometro.
function subscribeToShake(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Accelerometer.setUpdateInterval(100);

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z) * 9.81;
    const detected = magnitude > threshold;
    const progress = Math.min(magnitude / threshold, 1);

    onDetected({ magnitude, detected, progress });
  });

  return () => sub.remove();
}

// Entrada principal de caminar.
function subscribeToWalk(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  return subscribeToWalkByAccelerometer(threshold, onDetected);
}

// Valida caminar por tiempo acumulado de movimiento real
function subscribeToWalkByAccelerometer(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Accelerometer.setUpdateInterval(70);

  const requiredWalkMs = threshold * 1000;
  const MIN_DYNAMIC_ACTIVITY = 0.022;
  const MAX_DYNAMIC_FOR_WALK = 0.75;
  const REQUIRED_ACTIVE_SCORE = 2;
  const MAX_ACTIVE_SCORE = 5;
  const IDLE_FAIL_MS = 3000;
  const INITIAL_IGNORE_SAMPLES = 3;

  let samples = 0;
  let activeScore = 0;
  let accumulatedWalkMs = 0;
  let lastSampleAt = Date.now();
  let lastWalkingAt = Date.now();
  let completed = false;
  let failed = false;

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    if (completed || failed) return;

    const now = Date.now();
    const deltaMs = Math.max(0, Math.min(now - lastSampleAt, 250));
    lastSampleAt = now;
    samples += 1;

    const magnitudeG = Math.sqrt(x * x + y * y + z * z);
    const dynamic = Math.abs(magnitudeG - 1);
    const isMotionSample =
      samples > INITIAL_IGNORE_SAMPLES &&
      dynamic >= MIN_DYNAMIC_ACTIVITY &&
      dynamic <= MAX_DYNAMIC_FOR_WALK;

    activeScore = isMotionSample
      ? Math.min(activeScore + 1, MAX_ACTIVE_SCORE)
      : Math.max(activeScore - 1, 0);

    const isWalking = activeScore >= REQUIRED_ACTIVE_SCORE;

    if (isWalking) {
      accumulatedWalkMs += deltaMs;
      lastWalkingAt = now;
    }

    const idleMs = now - lastWalkingAt;
    const progress = Math.min(accumulatedWalkMs / requiredWalkMs, 1);
    const detected = progress >= 1;
    const shouldFail = !detected && idleMs > IDLE_FAIL_MS;

    onDetected({
      magnitude: accumulatedWalkMs / 1000,
      detected,
      progress,
      failed: shouldFail,
      reason: shouldFail ? "walk_idle_timeout" : undefined,
    });

    if (detected || shouldFail) {
      completed = detected;
      failed = shouldFail;
      sub.remove();
    }
  });

  return () => sub.remove();
}

// Detecta inclinacion comparando contra una postura base
function subscribeToTilt(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Accelerometer.setUpdateInterval(100);

  const BASELINE_SAMPLE_COUNT = 6;

  let baselineX = 0;
  let baselineY = 0;
  let baselineZ = 0;
  let baselineSamples = 0;

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    if (baselineSamples < BASELINE_SAMPLE_COUNT) {
      baselineX = (baselineX * baselineSamples + x) / (baselineSamples + 1);
      baselineY = (baselineY * baselineSamples + y) / (baselineSamples + 1);
      baselineZ = (baselineZ * baselineSamples + z) / (baselineSamples + 1);
      baselineSamples += 1;

      onDetected({ magnitude: 0, detected: false, progress: 0 });
      return;
    }

    const baselineNorm = Math.sqrt(
      baselineX * baselineX + baselineY * baselineY + baselineZ * baselineZ,
    );
    const currentNorm = Math.sqrt(x * x + y * y + z * z);
    const dot = baselineX * x + baselineY * y + baselineZ * z;
    const cosine = Math.max(
      -1,
      Math.min(1, dot / (baselineNorm * currentNorm || 1)),
    );
    const angle = Math.acos(cosine);
    const progress = Math.min(angle / threshold, 1);
    const detected = angle > threshold;

    onDetected({ magnitude: angle, detected, progress });
  });

  return () => sub.remove();
}

// Detecta giro rapido usando el eje Z del giroscopio
function subscribeToRotate(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Gyroscope.setUpdateInterval(100);

  const sub = Gyroscope.addListener(({ x, y, z }) => {
    const magnitude = Math.abs(z);
    const progress = Math.min(magnitude / threshold, 1);
    const detected = magnitude > threshold;

    onDetected({ magnitude, detected, progress });
  });

  return () => sub.remove();
}
