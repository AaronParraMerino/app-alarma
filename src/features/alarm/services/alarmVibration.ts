import { AlarmVibrationPattern } from '../types/alarm.types';

export type AlarmVibrationOptionId =
  | AlarmVibrationPattern
  | 'none';

export interface AlarmVibrationOption {
  id: AlarmVibrationOptionId;
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
  icon: string;
  pattern: number[] | null;
}

export const DEFAULT_ALARM_VIBRATION_PATTERN: AlarmVibrationPattern =
  'classic';

export const ALARM_VIBRATION_OPTIONS: AlarmVibrationOption[] = [
  {
    id: 'classic',
    labelEs: 'Clasica',
    labelEn: 'Classic',
    descriptionEs: 'Ritmo equilibrado para uso diario.',
    descriptionEn: 'Balanced rhythm for daily use.',
    icon: 'phone-portrait-outline',
    pattern: [
      0,
      500,
      350,
      500,
      350,
      900,
    ],
  },
  {
    id: 'shortPulse',
    labelEs: 'Pulso corto',
    labelEn: 'Short pulse',
    descriptionEs: 'Golpes breves y repetidos.',
    descriptionEn: 'Brief repeated pulses.',
    icon: 'radio-button-on-outline',
    pattern: [
      0,
      180,
      130,
      180,
      130,
      180,
      600,
    ],
  },
  {
    id: 'intense',
    labelEs: 'Intensa',
    labelEn: 'Intense',
    descriptionEs: 'Vibracion fuerte para sueno profundo.',
    descriptionEn: 'Strong vibration for deep sleep.',
    icon: 'flash-outline',
    pattern: [
      0,
      800,
      180,
      800,
      180,
      1000,
    ],
  },
  {
    id: 'steady',
    labelEs: 'Constante',
    labelEn: 'Steady',
    descriptionEs: 'Pulsos largos con pausas cortas.',
    descriptionEn: 'Long pulses with short pauses.',
    icon: 'remove-outline',
    pattern: [
      0,
      1200,
      250,
      1200,
      450,
    ],
  },
  {
    id: 'none',
    labelEs: 'Sin vibracion',
    labelEn: 'No vibration',
    descriptionEs: 'Solo sonido, sin vibrar el dispositivo.',
    descriptionEn: 'Sound only, without device vibration.',
    icon: 'phone-portrait',
    pattern: null,
  },
];

export function normalizeAlarmVibrationPattern(
  value: unknown,
): AlarmVibrationPattern {
  return ALARM_VIBRATION_OPTIONS.some(
    (option) => option.id === value && option.id !== 'none',
  )
    ? value as AlarmVibrationPattern
    : DEFAULT_ALARM_VIBRATION_PATTERN;
}

export function getAlarmVibrationPattern(
  value: unknown,
): number[] {
  const patternId = normalizeAlarmVibrationPattern(value);
  const option = ALARM_VIBRATION_OPTIONS.find(
    (item) => item.id === patternId,
  );

  return option?.pattern ?? ALARM_VIBRATION_OPTIONS[0].pattern ?? [];
}

export function getAlarmVibrationOptionLabel(
  vibrationEnabled: boolean,
  value: unknown,
  isSpanish: boolean,
): string {
  const optionId: AlarmVibrationOptionId = vibrationEnabled
    ? normalizeAlarmVibrationPattern(value)
    : 'none';

  const option =
    ALARM_VIBRATION_OPTIONS.find((item) => item.id === optionId) ??
    ALARM_VIBRATION_OPTIONS[0];

  return isSpanish ? option.labelEs : option.labelEn;
}
