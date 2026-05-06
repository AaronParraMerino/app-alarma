import { DEFAULT_ALARM_SOUND_URI } from './alarmService';

const ALARM_SOUND_ASSETS: Record<string, number> = {
  blendertimer_cyber_alarms_synthesized_116358:
    require('../../../../assets/sounds/blendertimer_cyber_alarms_synthesized_116358.mp3'),
  dennish18_biohazard_alarm_143105:
    require('../../../../assets/sounds/dennish18_biohazard_alarm_143105.mp3'),
  freesound_community_056338_25_alien_alarms_87068:
    require('../../../../assets/sounds/freesound_community_056338_25_alien_alarms_87068.mp3'),
  freesound_community_alarm_26718:
    require('../../../../assets/sounds/freesound_community_alarm_26718.mp3'),
  freesound_community_alarm_no3_14864:
    require('../../../../assets/sounds/freesound_community_alarm_no3_14864.mp3'),
  freesound_community_facility_siren_loopable_100687:
    require('../../../../assets/sounds/freesound_community_facility_siren_loopable_100687.mp3'),
  freesound_community_imminent2_80967:
    require('../../../../assets/sounds/freesound_community_imminent2_80967.mp3'),
  freesound_community_meltdown_73617:
    require('../../../../assets/sounds/freesound_community_meltdown_73617.mp3'),
  freesound_community_multiple_tornado_alarms_17375:
    require('../../../../assets/sounds/freesound_community_multiple_tornado_alarms_17375.mp3'),
  freesound_community_thunder_69076:
    require('../../../../assets/sounds/freesound_community_thunder_69076.mp3'),
  jeremayjimenez_greece_eas_alarm_451404:
    require('../../../../assets/sounds/jeremayjimenez_greece_eas_alarm_451404.mp3'),
  jeremayjimenez_saudi_arabia_eas_alarm_1924_526917:
    require('../../../../assets/sounds/jeremayjimenez_saudi_arabia_eas_alarm_1924_526917.mp3'),
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
