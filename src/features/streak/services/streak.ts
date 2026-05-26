// src/features/streak/services/streak.ts
import db from '../../../shared/db/localDB';
import { supabase } from '../../../shared/db/supabaseClient';

import {
  AlarmStreakEvent,
  CreateAlarmStreakEventInput,
  StreakEventType,
  StreakSummary,
} from '../types/streak.types';

const ONE_DAY_MS = 86_400_000;
const PROTECTION_UNLOCK_STREAK = 30;
const MAX_PROTECTIONS = 3;

function getTodayDateKey(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function normalizeTimestamp(raw: unknown): number {
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
}

function createStreakEventId(
  userId: string,
  eventType: StreakEventType,
  createdAt: number,
): string {
  const random = Math.random().toString(36).slice(2);

  return `${createdAt}-${eventType}-${userId}-${random}`;
}

function buildAlarmStreakEvent({
  userId,
  alarmId = null,
  eventType,
  alarmTime = null,
  eventDate = getTodayDateKey(),
  usedProtection = false,
  protectionsBefore = 0,
  protectionsAfter = 0,
  createdAt = Date.now(),
}: CreateAlarmStreakEventInput): AlarmStreakEvent {
  return {
    id: createStreakEventId(userId, eventType, createdAt),
    userId,
    alarmId,
    eventType,
    alarmTime,
    eventDate,
    usedProtection,
    protectionsBefore,
    protectionsAfter,
    createdAt,
    synced: false,
  };
}

function mapRowToAlarmStreakEvent(row: any): AlarmStreakEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    alarmId: row.alarm_id ? String(row.alarm_id) : null,
    eventType: row.event_type as StreakEventType,
    alarmTime: row.alarm_time ? String(row.alarm_time) : null,
    eventDate: String(row.event_date),
    usedProtection:
      row.used_protection === true ||
      Number(row.used_protection) === 1,
    protectionsBefore: Number(row.protections_before ?? 0),
    protectionsAfter: Number(row.protections_after ?? 0),
    synced:
      row.synced === true ||
      Number(row.synced) === 1,
    createdAt: normalizeTimestamp(row.created_at),
  };
}

export function insertAlarmStreakEventLocal(
  event: AlarmStreakEvent,
  synced = false,
): void {
  db.runSync(
    `
    INSERT OR REPLACE INTO alarm_streak_events (
      id,
      user_id,
      alarm_id,
      event_type,
      alarm_time,
      event_date,
      used_protection,
      protections_before,
      protections_after,
      synced,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      event.id,
      event.userId,
      event.alarmId,
      event.eventType,
      event.alarmTime,
      event.eventDate,
      event.usedProtection ? 1 : 0,
      event.protectionsBefore,
      event.protectionsAfter,
      synced ? 1 : 0,
      event.createdAt,
    ],
  );
}

export function getAlarmStreakEventsLocal(
  userId: string,
  limit = 120,
): AlarmStreakEvent[] {
  const rows = db.getAllSync(
    `
    SELECT *
    FROM alarm_streak_events
    WHERE user_id = ?
    ORDER BY event_date DESC, created_at DESC
    LIMIT ?
    `,
    [
      userId,
      limit,
    ],
  );

  return rows.map(mapRowToAlarmStreakEvent);
}

export function getUnsyncedAlarmStreakEventsLocal(
  userId?: string,
): AlarmStreakEvent[] {
  const rows = userId
    ? db.getAllSync(
        `
        SELECT *
        FROM alarm_streak_events
        WHERE synced = 0
          AND user_id = ?
        ORDER BY created_at ASC
        `,
        [userId],
      )
    : db.getAllSync(
        `
        SELECT *
        FROM alarm_streak_events
        WHERE synced = 0
        ORDER BY created_at ASC
        `,
      );

  return rows.map(mapRowToAlarmStreakEvent);
}

export function markAlarmStreakEventAsSyncedLocal(id: string): void {
  db.runSync(
    `
    UPDATE alarm_streak_events
    SET synced = 1
    WHERE id = ?
    `,
    [id],
  );
}

export async function insertAlarmStreakEventCloud(
  event: AlarmStreakEvent,
): Promise<void> {
  const { error } = await supabase
    .from('alarm_streak_events')
    .upsert([
      {
        id: event.id,
        user_id: event.userId,
        alarm_id: event.alarmId,
        event_type: event.eventType,
        alarm_time: event.alarmTime,
        event_date: event.eventDate,
        used_protection: event.usedProtection,
        protections_before: event.protectionsBefore,
        protections_after: event.protectionsAfter,
        created_at: new Date(event.createdAt).toISOString(),
      },
    ]);

  if (error) {
    throw error;
  }
}

export async function getAlarmStreakEventsCloud(
  userId: string,
  limit = 120,
): Promise<AlarmStreakEvent[]> {
  const { data, error } = await supabase
    .from('alarm_streak_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', {
      ascending: false,
    })
    .order('created_at', {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRowToAlarmStreakEvent);
}

export async function recordAlarmStreakEvent(
  input: CreateAlarmStreakEventInput,
): Promise<void> {
  const event = buildAlarmStreakEvent(input);

  insertAlarmStreakEventLocal(event);

  try {
    await insertAlarmStreakEventCloud(event);
    markAlarmStreakEventAsSyncedLocal(event.id);
  } catch (error) {
    console.log(
      '[Streak] Evento guardado localmente, pendiente de sincronizar:',
      error,
    );
  }
}

function mergeEvents(
  localEvents: AlarmStreakEvent[],
  cloudEvents: AlarmStreakEvent[],
): AlarmStreakEvent[] {
  const map = new Map<string, AlarmStreakEvent>();

  localEvents.forEach(event => {
    map.set(event.id, event);
  });

  cloudEvents.forEach(event => {
    map.set(event.id, event);
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.eventDate === b.eventDate) {
      return b.createdAt - a.createdAt;
    }

    return b.eventDate.localeCompare(a.eventDate);
  });
}

function getDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function getDayStatusMap(
  events: AlarmStreakEvent[],
): Map<string, StreakEventType> {
  const byDay = new Map<string, StreakEventType>();

  events.forEach(event => {
    const current = byDay.get(event.eventDate);

    if (current === 'completed') {
      return;
    }

    if (current === 'frozen' && event.eventType === 'missed') {
      return;
    }

    byDay.set(event.eventDate, event.eventType);
  });

  return byDay;
}

function calculateCurrentStreak(events: AlarmStreakEvent[]): number {
  if (events.length === 0) {
    return 0;
  }

  const byDay = getDayStatusMap(events);

  const latestEvent = [...events].sort((a, b) => {
    if (a.eventDate === b.eventDate) {
      return b.createdAt - a.createdAt;
    }

    return b.eventDate.localeCompare(a.eventDate);
  })[0];

  if (!latestEvent) {
    return 0;
  }

  let streak = 0;
  let cursor = getDateFromKey(latestEvent.eventDate);

  while (true) {
    const dateKey = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, '0'),
      String(cursor.getDate()).padStart(2, '0'),
    ].join('-');

    const status = byDay.get(dateKey);

    if (status === 'completed' || status === 'frozen') {
      streak += 1;
      cursor = new Date(cursor.getTime() - ONE_DAY_MS);
      continue;
    }

    break;
  }

  return streak;
}

function calculateBestStreak(events: AlarmStreakEvent[]): number {
  const validDays = Array.from(
    new Set(
      events
        .filter(
          event =>
            event.eventType === 'completed' ||
            event.eventType === 'frozen',
        )
        .map(event => event.eventDate),
    ),
  ).sort();

  if (validDays.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let i = 1; i < validDays.length; i += 1) {
    const previous = getDateFromKey(validDays[i - 1]);
    const actual = getDateFromKey(validDays[i]);

    const diffDays = Math.round(
      (actual.getTime() - previous.getTime()) / ONE_DAY_MS,
    );

    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
  }

  return best;
}

function getProtectionsAvailable(events: AlarmStreakEvent[]): number {
  const lastProtectionEvent = events
    .filter(
      event =>
        event.usedProtection ||
        event.protectionsAfter > 0 ||
        event.protectionsBefore > 0,
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  return lastProtectionEvent?.protectionsAfter ?? 0;
}

export async function getStreakSummary(
  userId: string,
): Promise<StreakSummary> {
  const localEvents = getAlarmStreakEventsLocal(userId);

  let events = localEvents;

  try {
    const cloudEvents = await getAlarmStreakEventsCloud(userId);

    cloudEvents.forEach(event => {
      insertAlarmStreakEventLocal(event, true);
    });

    events = mergeEvents(localEvents, cloudEvents);
  } catch (error) {
    console.log('[Streak] No se pudo sincronizar resumen:', error);
  }

  const todayKey = getTodayDateKey();
  const todayEvent = events.find(event => event.eventDate === todayKey);

  return {
    currentStreak: calculateCurrentStreak(events),
    bestStreak: calculateBestStreak(events),
    successfulAlarms: events.filter(event => event.eventType === 'completed')
      .length,
    protectionsAvailable: getProtectionsAvailable(events),
    protectionsUsed: events.filter(event => event.usedProtection).length,
    todayStatus: todayEvent?.eventType ?? null,
    events,
  };
}

export async function recordCompletedAlarmStreak(input: {
  userId: string;
  alarmId?: string | null;
  alarmTime?: string | null;
}): Promise<void> {
  const summary = await getStreakSummary(input.userId);

  const currentProtections = summary.protectionsAvailable;

  const previewEvent = buildAlarmStreakEvent({
    userId: input.userId,
    alarmId: input.alarmId ?? null,
    alarmTime: input.alarmTime ?? null,
    eventType: 'completed',
    protectionsBefore: currentProtections,
    protectionsAfter: currentProtections,
  });

  const previewEvents = [
    previewEvent,
    ...summary.events,
  ];

  const nextStreak = calculateCurrentStreak(previewEvents);

  const shouldUnlockProtections =
    nextStreak > 0 &&
    nextStreak % PROTECTION_UNLOCK_STREAK === 0;

  await recordAlarmStreakEvent({
    userId: input.userId,
    alarmId: input.alarmId ?? null,
    alarmTime: input.alarmTime ?? null,
    eventType: 'completed',
    protectionsBefore: currentProtections,
    protectionsAfter: shouldUnlockProtections
      ? MAX_PROTECTIONS
      : currentProtections,
  });
}

export async function recordMissedOrFrozenAlarm(input: {
  userId: string;
  alarmId?: string | null;
  alarmTime?: string | null;
}): Promise<StreakEventType> {
  const summary = await getStreakSummary(input.userId);

  const protectionsBefore = summary.protectionsAvailable;
  const hasProtection = protectionsBefore > 0;

  const eventType: StreakEventType = hasProtection ? 'frozen' : 'missed';

  await recordAlarmStreakEvent({
    userId: input.userId,
    alarmId: input.alarmId ?? null,
    alarmTime: input.alarmTime ?? null,
    eventType,
    usedProtection: hasProtection,
    protectionsBefore,
    protectionsAfter: hasProtection ? protectionsBefore - 1 : 0,
  });

  return eventType;
}