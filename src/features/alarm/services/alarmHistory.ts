// src/features/alarm/services/alarmHistory.ts
import db from '../../../shared/db/localDB';
import { supabase } from '../../../shared/db/supabaseClient';
import { Alarm } from '../types/alarm.types';
import {
  AlarmHistoryAction,
  AlarmHistoryEvent,
  CreateAlarmHistoryEventInput,
} from '../types/alarmHistory.types';

interface InsertAlarmHistoryLocalOptions {
  synced?: boolean;
}

const parseJson = <T,>(
  value: unknown,
  fallback: T,
): T => {
  if (!value) return fallback;

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeTimestamp = (
  raw: unknown,
): number => {
  if (!raw) return Date.now();

  if (typeof raw === 'number') {
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
  }

  if (typeof raw === 'string') {
    const numericValue = Number(raw);

    if (!Number.isNaN(numericValue)) {
      return numericValue < 1_000_000_000_000
        ? numericValue * 1000
        : numericValue;
    }

    const parsedDate = Date.parse(raw);

    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }

  return Date.now();
};

const formatAlarmTime = (
  hour: number,
  minute: number,
): string => {
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
};

const splitAlarmTime = (
  time: string,
): {
  hour: number;
  minute: number;
} => {
  const [rawHour = '0', rawMinute = '0'] = String(time).split(':');

  return {
    hour: Number.parseInt(rawHour, 10) || 0,
    minute: Number.parseInt(rawMinute, 10) || 0,
  };
};

const createHistoryId = (
  alarmId: string,
  action: AlarmHistoryAction,
  createdAt: number,
): string => {
  const random = Math.random().toString(36).slice(2);

  return `${createdAt}-${action}-${alarmId}-${random}`;
};

const mapRowToAlarmHistoryEvent = (
  row: any,
): AlarmHistoryEvent => {
  const {
    hour,
    minute,
  } = splitAlarmTime(row.time ?? '00:00');

  return {
    id: String(row.id),
    alarmId: String(row.alarm_id),
    userId: String(row.user_id),
    action: row.action as AlarmHistoryAction,
    hour,
    minute,
    label: String(row.label ?? ''),
    repeatDays: parseJson(row.repeat_days, []),
    missions: parseJson(row.missions, []),
    randomMissions:
      row.random_missions === true ||
      Number(row.random_missions) === 1,
    soundUri: row.sound_uri ?? null,
    enabled:
      row.enabled === true ||
      Number(row.enabled) === 1,
    synced:
      row.synced === true ||
      Number(row.synced) === 1,
    createdAt: normalizeTimestamp(row.created_at),
  };
};

export const buildAlarmHistoryEvent = ({
  alarmId,
  userId,
  action,
  hour,
  minute,
  label = '',
  repeatDays = [],
  missions = [],
  randomMissions = false,
  soundUri = null,
  enabled = false,
  createdAt = Date.now(),
}: CreateAlarmHistoryEventInput): AlarmHistoryEvent => {
  return {
    id: createHistoryId(alarmId, action, createdAt),
    alarmId,
    userId,
    action,
    hour,
    minute,
    label,
    repeatDays,
    missions,
    randomMissions,
    soundUri,
    enabled,
    createdAt,
    synced: false,
  };
};

export const buildAlarmHistoryEventFromAlarm = (
  alarm: Alarm,
  userId: string,
  action: AlarmHistoryAction,
): AlarmHistoryEvent => {
  return buildAlarmHistoryEvent({
    alarmId: alarm.id,
    userId,
    action,
    hour: alarm.hour,
    minute: alarm.minute,
    label: alarm.label,
    repeatDays: alarm.repeatDays,
    missions: alarm.missions,
    randomMissions: alarm.randomMissions,
    soundUri: alarm.soundUri,
    enabled: alarm.enabled,
  });
};

export const insertAlarmHistoryLocal = (
  event: AlarmHistoryEvent,
  options: InsertAlarmHistoryLocalOptions = {},
): void => {
  const synced = options.synced ?? event.synced ?? false;

  db.runSync(
    `
    INSERT OR REPLACE INTO alarm_history (
      id,
      alarm_id,
      user_id,
      action,
      time,
      label,
      repeat_days,
      missions,
      random_missions,
      sound_uri,
      enabled,
      synced,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      event.id,
      event.alarmId,
      event.userId,
      event.action,
      formatAlarmTime(event.hour, event.minute),
      event.label,
      JSON.stringify(event.repeatDays),
      JSON.stringify(event.missions),
      event.randomMissions ? 1 : 0,
      event.soundUri,
      event.enabled ? 1 : 0,
      synced ? 1 : 0,
      event.createdAt,
    ],
  );
};

export const getAlarmHistoryLocal = (
  userId: string,
  limit = 100,
): AlarmHistoryEvent[] => {
  const rows = db.getAllSync(
    `
    SELECT *
    FROM alarm_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
    `,
    [
      userId,
      limit,
    ],
  );

  return rows.map(mapRowToAlarmHistoryEvent);
};

export const getUnsyncedAlarmHistoryLocal = (
  userId?: string,
): AlarmHistoryEvent[] => {
  const rows = userId
    ? db.getAllSync(
        `
        SELECT *
        FROM alarm_history
        WHERE synced = 0
          AND user_id = ?
        ORDER BY created_at ASC
        `,
        [userId],
      )
    : db.getAllSync(
        `
        SELECT *
        FROM alarm_history
        WHERE synced = 0
        ORDER BY created_at ASC
        `,
      );

  return rows.map(mapRowToAlarmHistoryEvent);
};

export const markAlarmHistoryAsSyncedLocal = (
  id: string,
): void => {
  db.runSync(
    `
    UPDATE alarm_history
    SET synced = 1
    WHERE id = ?
    `,
    [id],
  );
};

export const insertAlarmHistoryCloud = async (
  event: AlarmHistoryEvent,
): Promise<void> => {
  const { error } = await supabase
    .from('alarm_history')
    .upsert([
      {
        id: event.id,
        alarm_id: event.alarmId,
        user_id: event.userId,
        action: event.action,
        time: formatAlarmTime(event.hour, event.minute),
        label: event.label,
        repeat_days: event.repeatDays,
        missions: event.missions,
        random_missions: event.randomMissions,
        sound_uri: event.soundUri,
        enabled: event.enabled,
        created_at: new Date(event.createdAt).toISOString(),
      },
    ]);

  if (error) {
    throw error;
  }
};

export const getAlarmHistoryCloud = async (
  userId: string,
  limit = 100,
): Promise<AlarmHistoryEvent[]> => {
  const { data, error } = await supabase
    .from('alarm_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRowToAlarmHistoryEvent);
};

export const recordAlarmHistory = async (
  alarm: Alarm,
  userId: string | undefined,
  action: AlarmHistoryAction,
): Promise<void> => {
  if (!userId) return;

  const event = buildAlarmHistoryEventFromAlarm(
    alarm,
    userId,
    action,
  );

  insertAlarmHistoryLocal(event);

  try {
    await insertAlarmHistoryCloud(event);
    markAlarmHistoryAsSyncedLocal(event.id);
  } catch (error) {
    console.log(
      '[AlarmHistory] Historial guardado localmente, pendiente de sincronizar:',
      error,
    );
  }
};