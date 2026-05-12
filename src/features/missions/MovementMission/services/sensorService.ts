import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { SensorCapabilities, MovementType } from '../types/movement.types';
import { MOVEMENT_THRESHOLDS } from '../constants/movementConstants';

// ─── Capability Check ────────────────────────────────────────────────────────

export async function checkSensorCapabilities(): Promise<SensorCapabilities> {
  const [accel, gyro, pedo] = await Promise.all([
    Accelerometer.isAvailableAsync().catch(() => false),
    Gyroscope.isAvailableAsync().catch(() => false),
    Platform.OS === 'android'
      ? Pedometer.isAvailableAsync().catch(() => false)
      : Promise.resolve(false),
  ]);

  return {
    hasAccelerometer: accel as boolean,
    hasGyroscope: gyro as boolean,
    hasPedometer: pedo as boolean,
  };
}

// ─── Movement Detection ───────────────────────────────────────────────────────

export type SensorUnsubscribe = () => void;

export interface SensorReading {
  magnitude: number;
  detected: boolean;
}

/**
 * Subscribes to the relevant sensor for a movement type and calls `onDetected`
 * when the threshold is crossed. Returns an unsubscribe function.
 */
export function subscribeToMovement(
  type: MovementType,
  onDetected: (reading: SensorReading) => void,
): SensorUnsubscribe {
  const threshold = MOVEMENT_THRESHOLDS[type];

  if (type === 'shake' || type === 'walk') {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z) * 9.81; // convert to m/s²
      onDetected({ magnitude, detected: magnitude > threshold });
    });
    return () => sub.remove();
  }

  if (type === 'rotate') {
    Gyroscope.setUpdateInterval(100);
    const sub = Gyroscope.addListener(({ z }) => {
      const magnitude = Math.abs(z);
      onDetected({ magnitude, detected: magnitude > threshold });
    });
    return () => sub.remove();
  }

  if (type === 'tilt_left' || type === 'tilt_right') {
    Gyroscope.setUpdateInterval(100);
    const sub = Gyroscope.addListener(({ y }) => {
      const magnitude = type === 'tilt_left' ? -y : y;
      onDetected({ magnitude, detected: magnitude > threshold });
    });
    return () => sub.remove();
  }

  if (type === 'tilt_up' || type === 'tilt_down') {
    Gyroscope.setUpdateInterval(100);
    const sub = Gyroscope.addListener(({ x }) => {
      const magnitude = type === 'tilt_up' ? x : -x;
      onDetected({ magnitude, detected: magnitude > threshold });
    });
    return () => sub.remove();
  }

  // fallback
  return () => {};
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function requestSensorPermissions(): Promise<boolean> {
  try {
    // expo-sensors on Android 12+ requires BODY_SENSORS or HIGH_SAMPLING_RATE_SENSORS
    // expo-sensors handles this internally; for Pedometer we need activity recognition
    if (Platform.OS === 'android') {
      const { status } = await Pedometer.requestPermissionsAsync();
      // Non-fatal if denied — we simply won't use pedometer
      console.log('Pedometer permission:', status);
    }
    return true;
  } catch (e) {
    console.warn('Sensor permission error:', e);
    return true; // accelerometer/gyroscope don't need explicit permissions on most devices
  }
}