import { DEFAULT_ALARM_SOUND_URI } from './alarmService';

const ALARM_SOUND_ASSETS: Record<string, number> = {
  blendertimer_cyber_alarms_synthesized_116358:
    require('../../../../assets/sounds/blendertimer_cyber_alarms_synthesized_116358.mp3'),
  dennish18_biohazard_alarm_143105:
    require('../../../../assets/sounds/dennish18_biohazard_alarm_143105.mp3'),
  digital_bright_beeps:
    require('../../../../assets/sounds/digital_bright_beeps.mp3'),
  digital_alarm_buzzer:
    require('../../../../assets/sounds/digital_alarm_buzzer.mp3'),
  bedside_alarm_clock:
    require('../../../../assets/sounds/bedside_alarm_clock.mp3'),
  wind_up_alarm_bell:
    require('../../../../assets/sounds/wind_up_alarm_bell.mp3'),
  freesound_community_alarm_26718:
    require('../../../../assets/sounds/freesound_community_alarm_26718.mp3'),
  freesound_community_alarm_no3_14864:
    require('../../../../assets/sounds/freesound_community_alarm_no3_14864.mp3'),
  freesound_community_facility_siren_loopable_100687:
    require('../../../../assets/sounds/freesound_community_facility_siren_loopable_100687.mp3'),
  jeremayjimenez_saudi_arabia_eas_alarm_1924_526917:
    require('../../../../assets/sounds/jeremayjimenez_saudi_arabia_eas_alarm_1924_526917.mp3'),
  morning_joy_alarm_clock:
    require('../../../../assets/sounds/morning_joy_alarm_clock.mp3'),
  soft_alarm_clock:
    require('../../../../assets/sounds/soft_alarm_clock.mp3'),
  phone_wake_tone:
    require('../../../../assets/sounds/phone_wake_tone.mp3'),
};

function toAssetKey(soundUri: string | null): string | null {
  if (!soundUri) return null;
  return soundUri.replace(/\.[^/.]+$/, '');
}

export function getAlarmSoundAsset(soundUri: string | null): number | null {
  const assetKey = toAssetKey(soundUri);
  if (!assetKey) return null;

  return ALARM_SOUND_ASSETS[assetKey] ?? ALARM_SOUND_ASSETS[toAssetKey(DEFAULT_ALARM_SOUND_URI)!];
}
