import db from '../../db/localDB';
import { Alarm, AlarmMission, RepeatDay } from '../../../features/alarm/types/alarm.types';

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

const mapRowToAlarm = (row: any): Alarm => {
  const [hh = '0', mm = '0'] = String(row.time ?? '0:0').split(':');
  return {
    id: String(row.id),
    hour: Number.parseInt(hh, 10) || 0,
    minute: Number.parseInt(mm, 10) || 0,
    label: String(row.label ?? ''),
    enabled: Number(row.active) === 1,
    repeatDays: parseJson<RepeatDay[]>(row.repeat_days, []),
    missions: parseJson<AlarmMission[]>(row.missions, []),
    randomMissions: Number(row.random_missions) === 1,
    soundUri: row.sound_uri ?? null,
    createdAt: normalizeTimestamp(Number(row.created_at)),
    updatedAt: normalizeTimestamp(Number(row.updated_at)),
  };
};

const normalizeAlarmInput = (alarm: any): Alarm => {
  if (typeof alarm.hour === 'number' && typeof alarm.minute === 'number') {
    return {
      ...alarm,
      label: alarm.label ?? '',
      enabled: Boolean(alarm.enabled),
      repeatDays: alarm.repeatDays ?? [],
      missions: alarm.missions ?? [],
      randomMissions: Boolean(alarm.randomMissions),
      soundUri: alarm.soundUri ?? null,
      createdAt: alarm.createdAt ?? Date.now(),
      updatedAt: alarm.updatedAt ?? Date.now(),
    };
  }

  const [hh = '0', mm = '0'] = String(alarm.time ?? '0:0').split(':');
  return {
    id: String(alarm.id),
    hour: Number.parseInt(hh, 10) || 0,
    minute: Number.parseInt(mm, 10) || 0,
    label: String(alarm.label ?? ''),
    enabled: Number(alarm.active) === 1 || Boolean(alarm.enabled),
    repeatDays: parseJson<RepeatDay[]>(alarm.repeat_days, alarm.repeatDays ?? []),
    missions: parseJson<AlarmMission[]>(alarm.missions, alarm.missions ?? []),
    randomMissions:
      Number(alarm.random_missions) === 1 || Boolean(alarm.randomMissions),
    soundUri: alarm.sound_uri ?? alarm.soundUri ?? null,
    createdAt: normalizeTimestamp(Number(alarm.created_at ?? Date.now())),
    updatedAt: normalizeTimestamp(Number(alarm.updated_at ?? Date.now())),
  };
};

export const getAlarmsLocal = (): Alarm[] => {
  const rows = db.getAllSync(`SELECT * FROM alarms ORDER BY time ASC`);
  return rows.map(mapRowToAlarm);
};

export const insertAlarmLocal = (input: Alarm): void => {
  const alarm = normalizeAlarmInput(input);
  const time = `${alarm.hour.toString().padStart(2, '0')}:${alarm.minute
    .toString()
    .padStart(2, '0')}`;

  db.runSync(
    `INSERT OR REPLACE INTO alarms (
      id, time, label, active, repeat_days, missions, random_missions,
      sound_uri, synced, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      alarm.id,
      time,
      alarm.label,
      alarm.enabled ? 1 : 0,
      JSON.stringify(alarm.repeatDays),
      JSON.stringify(alarm.missions),
      alarm.randomMissions ? 1 : 0,
      alarm.soundUri,
      0,
      alarm.createdAt,
      alarm.updatedAt,
    ],
  );
};

export const deleteAlarmLocal = (id: string): void => {
  db.runSync(`DELETE FROM alarms WHERE id = ?`, [id]);
};

export const getUnsyncedAlarms = (): Alarm[] => {
  const rows = db.getAllSync(`SELECT * FROM alarms WHERE synced = 0`);
  return rows.map(mapRowToAlarm);
};

export const markAsSynced = (id: string): void => {
  db.runSync(`UPDATE alarms SET synced = 1 WHERE id = ?`, [id]);
};