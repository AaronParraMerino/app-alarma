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

// Detecta una sacudida real con acelerometro.
function subscribeToShake(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Accelerometer.setUpdateInterval(50);

  const REQUIRED_SHAKES = 4;
  const SHAKE_WINDOW_MS = 900;
  const MIN_HIT_GAP_MS = 70;
  const MAX_HIT_GAP_MS = 350;
  const dynamicThreshold = threshold > 9.81 ? threshold - 9.81 : threshold;

  let hits: number[] = [];
  let lastHitAt = 0;
  let lastAxis = "";
  let lastDirection = 0;
  let completed = false;

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    if (completed) return;

    const now = Date.now();
    const magnitude = Math.sqrt(x * x + y * y + z * z) * 9.81;
    const dynamic = Math.abs(magnitude - 9.81);

    const values = [
      { axis: "x", value: x },
      { axis: "y", value: y },
      { axis: "z", value: z },
    ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const axis = values[0].axis;
    const direction = values[0].value >= 0 ? 1 : -1;
    const gapMs = now - lastHitAt;
    const isStrong = dynamic >= dynamicThreshold;
    const isAlternating =
      lastHitAt === 0 ||
      axis !== lastAxis ||
      direction !== lastDirection;

    if (isStrong && isAlternating && gapMs >= MIN_HIT_GAP_MS) {
      if (gapMs > MAX_HIT_GAP_MS) {
        hits = [];
      }

      hits = [...hits, now].filter((time) => now - time <= SHAKE_WINDOW_MS);

      lastHitAt = now;
      lastAxis = axis;
      lastDirection = direction;
    }

    const progress = Math.min(hits.length / REQUIRED_SHAKES, 1);
    const detected = progress >= 1;

    onDetected({ magnitude: dynamic, detected, progress });

    if (detected) {
      completed = true;
      sub.remove();
    }
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

// Valida caminar usando el contador real de pasos cuando esta disponible.
function subscribeToWalkByPedometer(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  const requiredSteps = Math.max(1, Math.round(threshold));
  const IDLE_FAIL_MS = 3500;

  let countedSteps = 0;
  let lastStepTotal = 0;
  let lastWalkingAt = Date.now();
  let completed = false;
  let failed = false;

  const timer = setInterval(() => {
    if (completed || failed) return;

    const now = Date.now();
    const idleMs = now - lastWalkingAt;
    const progress = Math.min(countedSteps / requiredSteps, 1);
    const shouldFail = progress < 1 && idleMs > IDLE_FAIL_MS;

    onDetected({
      magnitude: countedSteps,
      detected: false,
      progress,
      failed: shouldFail,
      reason: shouldFail ? "walk_idle_timeout" : undefined,
    });

    if (shouldFail) {
      failed = true;
      clearInterval(timer);
      sub.remove();
    }
  }, 250);

  const sub = Pedometer.watchStepCount(({ steps }) => {
    if (completed || failed) return;

    const now = Date.now();
    const newSteps = Math.max(0, steps - lastStepTotal);

    if (newSteps > 0) {
      countedSteps += newSteps;
      lastStepTotal = steps;
      lastWalkingAt = now;
    }

    const progress = Math.min(countedSteps / requiredSteps, 1);
    const detected = progress >= 1;

    onDetected({
      magnitude: countedSteps,
      detected,
      progress,
    });

    if (detected) {
      completed = true;
      clearInterval(timer);
      sub.remove();
    }
  });

  return () => {
    clearInterval(timer);
    sub.remove();
  };
}

// Valida caminar por tiempo acumulado de movimiento real.
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
  const MIN_Z_DELTA = 0.04;
  const MAX_Z_DOMINANCE_RATIO = 2.2;

  let samples = 0;
  let activeScore = 0;
  let accumulatedWalkMs = 0;
  let lastSampleAt = Date.now();
  let lastWalkingAt = Date.now();
  let lastX = 0;
  let lastY = 0;
  let lastZ = 0;
  let completed = false;
  let failed = false;

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    if (completed || failed) return;

    const now = Date.now();
    const deltaMs = Math.max(0, Math.min(now - lastSampleAt, 250));
    lastSampleAt = now;
    samples += 1;

    const deltaX = Math.abs(x - lastX);
    const deltaY = Math.abs(y - lastY);
    const deltaZ = Math.abs(z - lastZ);
    lastX = x;
    lastY = y;
    lastZ = z;

    const isZDominantMotion =
      deltaZ >= MIN_Z_DELTA &&
      deltaZ > (deltaX + deltaY) * MAX_Z_DOMINANCE_RATIO;

    const magnitudeG = Math.sqrt(x * x + y * y + z * z);
    const dynamic = Math.abs(magnitudeG - 1);
    const isMotionSample =
      samples > INITIAL_IGNORE_SAMPLES &&
      dynamic >= MIN_DYNAMIC_ACTIVITY &&
      dynamic <= MAX_DYNAMIC_FOR_WALK &&
      !isZDominantMotion;

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

// Detecta inclinacion lateral comparando contra una postura base
function subscribeToTilt(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Accelerometer.setUpdateInterval(80);

  const BASELINE_SAMPLE_COUNT = 8;
  const MAX_SHAKE_DYNAMIC = 0.35;
  const SIDE_AXIS_TOLERANCE = 0.45;
  const MIN_TILT_DELTA = 0.005;
  const HOLD_MS = 350;
  const targetAngle = normalizeAngleThreshold(threshold);

  let baselineX = 0;
  let baselineY = 0;
  let baselineZ = 0;
  let baselineSamples = 0;

  let lastSideAngleX = 0;
  let lastSideAngleY = 0;
  let accumulatedSideAngleX = 0;
  let accumulatedSideAngleY = 0;
  let stableSince: number | null = null;
  let completed = false;

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    if (completed) return;

    if (baselineSamples < BASELINE_SAMPLE_COUNT) {
      baselineX = (baselineX * baselineSamples + x) / (baselineSamples + 1);
      baselineY = (baselineY * baselineSamples + y) / (baselineSamples + 1);
      baselineZ = (baselineZ * baselineSamples + z) / (baselineSamples + 1);
      baselineSamples += 1;

      if (baselineSamples === BASELINE_SAMPLE_COUNT) {
        lastSideAngleX = Math.atan2(baselineY, baselineZ);
        lastSideAngleY = Math.atan2(baselineX, baselineZ);
      }

      onDetected({ magnitude: 0, detected: false, progress: 0 });
      return;
    }

    const now = Date.now();
    const currentNorm = Math.sqrt(x * x + y * y + z * z);
    const isStableAcceleration = Math.abs(currentNorm - 1) <= MAX_SHAKE_DYNAMIC;

    const sideAngleX = Math.atan2(y, z);
    const sideAngleY = Math.atan2(x, z);

    const deltaX = normalizeAngleDelta(sideAngleX - lastSideAngleX);
    const deltaY = normalizeAngleDelta(sideAngleY - lastSideAngleY);

    lastSideAngleX = sideAngleX;
    lastSideAngleY = sideAngleY;

    const isSideTiltX = Math.abs(x - baselineX) <= SIDE_AXIS_TOLERANCE;
    const isSideTiltY = Math.abs(y - baselineY) <= SIDE_AXIS_TOLERANCE;

    if (isStableAcceleration && isSideTiltX && Math.abs(deltaX) >= MIN_TILT_DELTA) {
      accumulatedSideAngleX += deltaX;
    }

    if (isStableAcceleration && isSideTiltY && Math.abs(deltaY) >= MIN_TILT_DELTA) {
      accumulatedSideAngleY += deltaY;
    }

    const angle = Math.max(
      Math.abs(accumulatedSideAngleX),
      Math.abs(accumulatedSideAngleY),
    );
    const progress = Math.min(angle / targetAngle, 1);
    const isAtTarget = progress >= 1 && isStableAcceleration;

    if (isAtTarget) {
      stableSince = stableSince ?? now;
    } else {
      stableSince = null;
    }

    const detected = stableSince !== null && now - stableSince >= HOLD_MS;

    onDetected({
      magnitude: angle,
      detected,
      progress,
      failed: false,
      reason: !isStableAcceleration ? "tilt_unstable_acceleration" : undefined,
    });

    if (detected) {
      completed = true;
      sub.remove();
    }
  });

  return () => sub.remove();
}

// Detecta giro real usando el eje dominante del giroscopio.
function subscribeToRotate(
  threshold: number,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  Gyroscope.setUpdateInterval(80);

  const targetAngle = normalizeAngleThreshold(threshold);
  const MIN_ROTATION_SPEED = 0.35;
  const MIN_DOMINANT_AXIS_RATIO = 0.62;
  const IDLE_FAIL_MS = 3000;

  let accumulatedRotation = 0;
  let lastSampleAt = Date.now();
  let lastRotationAt = Date.now();
  let dominantAxis: "x" | "y" | "z" | null = null;
  let lastDirection = 0;
  let completed = false;
  let failed = false;

  const sub = Gyroscope.addListener(({ x, y, z }) => {
    if (completed || failed) return;

    const now = Date.now();
    const deltaSeconds = Math.max(0, Math.min(now - lastSampleAt, 250)) / 1000;
    lastSampleAt = now;

    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const absZ = Math.abs(z);
    const totalMagnitude = Math.sqrt(x * x + y * y + z * z);
    const sampleAxis =
      absX >= absY && absX >= absZ
        ? "x"
        : absY >= absX && absY >= absZ
          ? "y"
          : "z";
    const axisMagnitude =
      sampleAxis === "x" ? absX : sampleAxis === "y" ? absY : absZ;
    const axisValue =
      sampleAxis === "x" ? x : sampleAxis === "y" ? y : z;
    const isDominantAxis =
      totalMagnitude > 0 &&
      axisMagnitude / totalMagnitude >= MIN_DOMINANT_AXIS_RATIO;
    const isRotating =
      totalMagnitude >= MIN_ROTATION_SPEED &&
      isDominantAxis &&
      (dominantAxis === null || dominantAxis === sampleAxis);
    const direction = axisValue >= 0 ? 1 : -1;
    const isSameDirection = lastDirection === 0 || direction === lastDirection;

    if (isRotating && isSameDirection) {
      accumulatedRotation += axisMagnitude * deltaSeconds;
      lastRotationAt = now;
      dominantAxis = sampleAxis;
      lastDirection = direction;
    }

    if (isRotating && !isSameDirection) {
      accumulatedRotation = Math.max(
        accumulatedRotation - axisMagnitude * deltaSeconds,
        0,
      );
      lastDirection = direction;
    }

    const idleMs = now - lastRotationAt;
    const progress = Math.min(accumulatedRotation / targetAngle, 1);
    const detected = progress >= 1;
    const shouldFail = !detected && idleMs > IDLE_FAIL_MS;

    onDetected({
      magnitude: accumulatedRotation,
      detected,
      progress,
      failed: shouldFail,
      reason: shouldFail
        ? "rotate_idle_timeout"
        : totalMagnitude >= MIN_ROTATION_SPEED && !isDominantAxis
          ? "rotate_unstable_axis"
          : undefined,
    });

    if (detected || shouldFail) {
      completed = detected;
      failed = shouldFail;
      sub.remove();
    }
  });

  return () => sub.remove();
}

function normalizeAngleThreshold(threshold: number): number {
  if (threshold > Math.PI * 2) {
    return (threshold * Math.PI) / 180;
  }

  return Math.max(threshold, 0.1);
}

function normalizeAngleDelta(angle: number): number {
  let normalized = angle;

  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }

  while (normalized < -Math.PI) {
    normalized += Math.PI * 2;
  }

  return normalized;
}
