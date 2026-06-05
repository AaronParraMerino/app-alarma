import db from '../../db/localDB';
import { Alarm, AlarmMission, RepeatDay } from '../../../features/alarm/types/alarm.types';
import { normalizeAlarmVibrationPattern } from '../../../features/alarm/services/alarmVibration';
import { normalizeRepeatDays } from '../../../features/alarm/utils/repeatSchedule';

interface InsertAlarmLocalOptions {
  synced?: boolean;
  userId?: string | null;
}

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeTimestamp = (raw: number | null | undefined): number => {
  if (!raw) return Date.now();
  if (raw < 1_000_000_000_000) return raw * 1000;
  return raw;
};

const normalizeMinVolumePercent = (raw: unknown): number => {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const mapRowToAlarm = (row: any): Alarm => {
  const [hh = '0', mm = '0'] = String(row.time ?? '0:0').split(':');
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    hour: Number.parseInt(hh, 10) || 0,
    minute: Number.parseInt(mm, 10) || 0,
    label: String(row.label ?? ''),
    enabled: Number(row.active) === 1,
    repeatDays: normalizeRepeatDays(parseJson<RepeatDay[]>(row.repeat_days, [])),
    missions: parseJson<AlarmMission[]>(row.missions, []),
    randomMissions: Number(row.random_missions) === 1,
    soundUri: row.sound_uri ?? null,
    minVolumePercent: normalizeMinVolumePercent(row.min_volume_percent),
    vibrationEnabled: row.vibration_enabled === undefined
      ? false
      : Number(row.vibration_enabled) === 1,
    vibrationPattern: normalizeAlarmVibrationPattern(row.vibration_pattern),
    createdAt: normalizeTimestamp(Number(row.created_at)),
    updatedAt: normalizeTimestamp(Number(row.updated_at)),
  };
};

const normalizeAlarmInput = (alarm: any): Alarm => {
  if (typeof alarm.hour === 'number' && typeof alarm.minute === 'number') {
    return {
      ...alarm,
      userId: alarm.userId ?? null,
      label: alarm.label ?? '',
      enabled: Boolean(alarm.enabled),
      repeatDays: normalizeRepeatDays(alarm.repeatDays ?? []),
      missions: alarm.missions ?? [],
      randomMissions: Boolean(alarm.randomMissions),
      soundUri: alarm.soundUri ?? null,
      minVolumePercent: normalizeMinVolumePercent(alarm.minVolumePercent),
      vibrationEnabled: alarm.vibrationEnabled ?? false,
      vibrationPattern: normalizeAlarmVibrationPattern(alarm.vibrationPattern),
      createdAt: alarm.createdAt ?? Date.now(),
      updatedAt: alarm.updatedAt ?? Date.now(),
    };
  }

  const [hh = '0', mm = '0'] = String(alarm.time ?? '0:0').split(':');
  return {
    id: String(alarm.id),
    userId: alarm.user_id ?? alarm.userId ?? null,
    hour: Number.parseInt(hh, 10) || 0,
    minute: Number.parseInt(mm, 10) || 0,
    label: String(alarm.label ?? ''),
    enabled: Number(alarm.active) === 1 || Boolean(alarm.enabled),
    repeatDays: normalizeRepeatDays(parseJson<RepeatDay[]>(alarm.repeat_days, alarm.repeatDays ?? [])),
    missions: parseJson<AlarmMission[]>(alarm.missions, alarm.missions ?? []),
    randomMissions:
      Number(alarm.random_missions) === 1 || Boolean(alarm.randomMissions),
    soundUri: alarm.sound_uri ?? alarm.soundUri ?? null,
    minVolumePercent: normalizeMinVolumePercent(
      alarm.min_volume_percent ?? alarm.minVolumePercent,
    ),
    vibrationEnabled: alarm.vibration_enabled === undefined
      ? alarm.vibrationEnabled ?? false
      : Number(alarm.vibration_enabled) === 1,
    vibrationPattern: normalizeAlarmVibrationPattern(
      alarm.vibration_pattern ?? alarm.vibrationPattern,
    ),
    createdAt: normalizeTimestamp(Number(alarm.created_at ?? Date.now())),
    updatedAt: normalizeTimestamp(Number(alarm.updated_at ?? Date.now())),
  };
};

export const getAllAlarmsLocal = (): Alarm[] => {
  const rows = db.getAllSync(`SELECT * FROM alarms ORDER BY time ASC`);
  return rows.map(mapRowToAlarm);
};

export const getAlarmsLocal = (userId?: string | null): Alarm[] => {
  const rows = userId
    ? db.getAllSync(
        `SELECT * FROM alarms WHERE user_id = ? ORDER BY time ASC`,
        [userId],
      )
    : db.getAllSync(
        `SELECT * FROM alarms WHERE user_id IS NULL ORDER BY time ASC`,
      );

  return rows.map(mapRowToAlarm);
};

export const insertAlarmLocal = (
  input: Alarm,
  options: InsertAlarmLocalOptions = {},
): void => {
  const alarm = normalizeAlarmInput(input);
  const userId = options.userId ?? alarm.userId ?? null;
  const time = `${alarm.hour.toString().padStart(2, '0')}:${alarm.minute
    .toString()
    .padStart(2, '0')}`;

  db.runSync(
    `INSERT OR REPLACE INTO alarms (
      id, user_id, time, label, active, repeat_days, missions, random_missions,
      sound_uri, min_volume_percent, vibration_enabled, vibration_pattern, synced, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      alarm.id,
      userId,
      time,
      alarm.label,
      alarm.enabled ? 1 : 0,
      JSON.stringify(alarm.repeatDays),
      JSON.stringify(alarm.missions),
      alarm.randomMissions ? 1 : 0,
      alarm.soundUri,
      normalizeMinVolumePercent(alarm.minVolumePercent),
      alarm.vibrationEnabled ? 1 : 0,
      alarm.vibrationPattern,
      options.synced ? 1 : 0,
      alarm.createdAt,
      alarm.updatedAt,
    ],
  );
};

export const deleteAlarmLocal = (id: string): void => {
  db.runSync(`DELETE FROM alarms WHERE id = ?`, [id]);
};

export const enqueueAlarmDeleteLocal = (alarmId: string, userId: string): void => {
  db.runSync(
    `
    INSERT OR IGNORE INTO pending_alarm_deletes (alarm_id, user_id, created_at)
    VALUES (?, ?, ?)
    `,
    [alarmId, userId, Date.now()],
  );
};

export const getPendingAlarmDeletes = (userId: string): string[] => {
  const rows = db.getAllSync<{ alarm_id: string }>(
    `
    SELECT alarm_id
    FROM pending_alarm_deletes
    WHERE user_id = ?
    ORDER BY created_at ASC
    `,
    [userId],
  );

  return rows.map(row => row.alarm_id);
};

export const clearPendingAlarmDeleteLocal = (alarmId: string, userId: string): void => {
  db.runSync(
    `
    DELETE FROM pending_alarm_deletes
    WHERE alarm_id = ?
      AND user_id = ?
    `,
    [alarmId, userId],
  );
};

export const getUnsyncedAlarms = (userId: string): Alarm[] => {
  const rows = db.getAllSync(
    `
    SELECT *
    FROM alarms
    WHERE synced = 0
      AND user_id = ?
    `,
    [userId],
  );

  return rows.map(mapRowToAlarm);
};

export const markAsSynced = (id: string): void => {
  db.runSync(`UPDATE alarms SET synced = 1 WHERE id = ?`, [id]);
};
