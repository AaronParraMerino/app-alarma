export interface AlarmSoundOption {
  id: string;
  labelEs: string;
  labelEn: string;
  uri: string | null;
  emoji: string;
}

export const DEFAULT_ALARM_SOUND_URI = 'freesound_community_alarm_26718.mp3';

export const ALARM_SOUND_OPTIONS: AlarmSoundOption[] = [
  {
    id: 'classic',
    labelEs: 'Despertador clasico',
    labelEn: 'Classic wake-up',
    uri: 'freesound_community_alarm_26718.mp3',
    emoji: 'A',
  },
  {
    id: 'alarm_no3',
    labelEs: 'Tono digital',
    labelEn: 'Digital tone',
    uri: 'freesound_community_alarm_no3_14864.mp3',
    emoji: 'A',
  },
  {
    id: 'bright_beeps',
    labelEs: 'Pitidos brillantes',
    labelEn: 'Bright beeps',
    uri: 'digital_bright_beeps.mp3',
    emoji: 'P',
  },
  {
    id: 'digital_buzzer',
    labelEs: 'Zumbador digital',
    labelEn: 'Digital buzzer',
    uri: 'digital_alarm_buzzer.mp3',
    emoji: 'Z',
  },
  {
    id: 'bedside_clock',
    labelEs: 'Reloj de mesa',
    labelEn: 'Bedside clock',
    uri: 'bedside_alarm_clock.mp3',
    emoji: 'R',
  },
  {
    id: 'wind_up_bell',
    labelEs: 'Campana mecanica',
    labelEn: 'Wind-up bell',
    uri: 'wind_up_alarm_bell.mp3',
    emoji: 'C',
  },
  {
    id: 'morning_joy',
    labelEs: 'Manana alegre',
    labelEn: 'Morning joy',
    uri: 'morning_joy_alarm_clock.mp3',
    emoji: 'M',
  },
  {
    id: 'soft_clock',
    labelEs: 'Despertar suave',
    labelEn: 'Soft wake-up',
    uri: 'soft_alarm_clock.mp3',
    emoji: 'S',
  },
  {
    id: 'phone_wake',
    labelEs: 'Tono de celular',
    labelEn: 'Phone wake tone',
    uri: 'phone_wake_tone.mp3',
    emoji: 'T',
  },
  {
    id: 'energetic',
    labelEs: 'Despertar energico',
    labelEn: 'Energetic wake-up',
    uri: 'blendertimer_cyber_alarms_synthesized_116358.mp3',
    emoji: 'E',
  },
  {
    id: 'urgent_clock',
    labelEs: 'Despertador intenso',
    labelEn: 'Intense wake-up',
    uri: 'dennish18_biohazard_alarm_143105.mp3',
    emoji: 'I',
  },
  {
    id: 'focus_alarm',
    labelEs: 'Alerta enfocada',
    labelEn: 'Focused alert',
    uri: 'freesound_community_facility_siren_loopable_100687.mp3',
    emoji: 'F',
  },
  {
    id: 'deep_wake',
    labelEs: 'Despertar profundo',
    labelEn: 'Deep wake-up',
    uri: 'jeremayjimenez_saudi_arabia_eas_alarm_1924_526917.mp3',
    emoji: 'D',
  },
  {
    id: 'silent',
    labelEs: 'Silencio',
    labelEn: 'Silent',
    uri: null,
    emoji: 'X',
  },
];

export function normalizeAlarmSoundUri(soundUri: string | null): string | null {
  if (!soundUri) return null;
  if (ALARM_SOUND_OPTIONS.some(option => option.uri === soundUri)) {
    return soundUri;
  }
  return DEFAULT_ALARM_SOUND_URI;
}

export function getAlarmSoundLabel(
  soundUri: string | null,
  isSpanish = true,
): string {
  const normalizedSoundUri = normalizeAlarmSoundUri(soundUri);
  const option = ALARM_SOUND_OPTIONS.find(s => s.uri === normalizedSoundUri);
  const resolvedOption = option ??
    ALARM_SOUND_OPTIONS.find(s => s.uri === DEFAULT_ALARM_SOUND_URI);
  if (!resolvedOption) return isSpanish ? 'Personalizado' : 'Custom';
  return isSpanish ? resolvedOption.labelEs : resolvedOption.labelEn;
}
