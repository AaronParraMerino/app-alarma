export interface AlarmSoundOption {
  id: string;
  label: string;
  uri: string | null;
  emoji: string;
}

export const DEFAULT_ALARM_SOUND_URI = 'freesound_community_alarm_26718.mp3';

export const ALARM_SOUND_OPTIONS: AlarmSoundOption[] = [
  {
    id: 'classic',
    label: 'Alarma clasica',
    uri: 'freesound_community_alarm_26718.mp3',
    emoji: 'A',
  },
  {
    id: 'alarm_no3',
    label: 'Alarma No. 3',
    uri: 'freesound_community_alarm_no3_14864.mp3',
    emoji: 'A',
  },
  {
    id: 'cyber',
    label: 'Cyber alarm',
    uri: 'blendertimer_cyber_alarms_synthesized_116358.mp3',
    emoji: 'C',
  },
  {
    id: 'biohazard',
    label: 'Biohazard',
    uri: 'dennish18_biohazard_alarm_143105.mp3',
    emoji: 'B',
  },
  {
    id: 'alien',
    label: 'Alien alarms',
    uri: 'freesound_community_056338_25_alien_alarms_87068.mp3',
    emoji: 'A',
  },
  {
    id: 'facility_siren',
    label: 'Sirena facility',
    uri: 'freesound_community_facility_siren_loopable_100687.mp3',
    emoji: 'S',
  },
  {
    id: 'imminent',
    label: 'Imminent',
    uri: 'freesound_community_imminent2_80967.mp3',
    emoji: 'I',
  },
  {
    id: 'meltdown',
    label: 'Meltdown',
    uri: 'freesound_community_meltdown_73617.mp3',
    emoji: 'M',
  },
  {
    id: 'tornado',
    label: 'Tornado',
    uri: 'freesound_community_multiple_tornado_alarms_17375.mp3',
    emoji: 'T',
  },
  {
    id: 'thunder',
    label: 'Thunder',
    uri: 'freesound_community_thunder_69076.mp3',
    emoji: 'T',
  },
  {
    id: 'greece_eas',
    label: 'Greece EAS',
    uri: 'jeremayjimenez_greece_eas_alarm_451404.mp3',
    emoji: 'G',
  },
  {
    id: 'saudi_eas',
    label: 'Saudi Arabia EAS',
    uri: 'jeremayjimenez_saudi_arabia_eas_alarm_1924_526917.mp3',
    emoji: 'S',
  },
  { id: 'silent', label: 'Silencio', uri: null, emoji: 'X' },
];

export function getAlarmSoundLabel(soundUri: string | null): string {
  const option = ALARM_SOUND_OPTIONS.find(s => s.uri === soundUri);
  return option?.label ?? 'Personalizado';
}
