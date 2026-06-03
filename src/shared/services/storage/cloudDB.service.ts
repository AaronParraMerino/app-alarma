import { supabase } from '../../db/supabaseClient';

export const insertAlarmCloud = async (alarm: any): Promise<void> => {
  const payload = {
    id:              alarm.id,
    user_id:         alarm.user_id,
    time:            `${alarm.hour}:${alarm.minute}`,
    label:           alarm.label ?? '',
    active:          alarm.enabled ? 1 : 0,
    repeat_days:     JSON.stringify(alarm.repeatDays ?? []),
    missions:        JSON.stringify(alarm.missions ?? []),
    random_missions: alarm.randomMissions ? 1 : 0,
    sound_uri:       alarm.soundUri ?? null,
    vibration_enabled: alarm.vibrationEnabled === false ? 0 : 1,
    vibration_pattern: alarm.vibrationPattern ?? 'classic',
  };

  const { error } = await supabase
    .from('alarms')
    .upsert([payload]);

  if (!error) {
    return;
  }

  if (
    String(error.message ?? '')
      .toLowerCase()
      .includes('vibration_pattern')
  ) {
    const {
      vibration_pattern: _vibrationPattern,
      ...fallbackPayload
    } = payload;

    const fallback = await supabase
      .from('alarms')
      .upsert([fallbackPayload]);

    if (!fallback.error) {
      return;
    }

    throw fallback.error;
  }

  throw error;
};

export const getAlarmsCloud = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data ?? [];
};

export const deleteAlarmCloud = async (
  alarmId: string,
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('alarms')
    .delete()
    .eq('id', alarmId)
    .eq('user_id', userId);

  if (error) throw error;
};
