// src/features/streak/services/streak.ts

import db from '../../../shared/db/localDB';
import { supabase } from '../../../shared/db/supabaseClient';

import {
  AlarmStreakEvent,
  CreateAlarmStreakEventInput,
  StreakEventType,
  StreakSummary,
} from '../types/streak.types';

function getDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getTodayDateKey(): string {
  return getDateKey(new Date());
}

function getYesterdayDateKey(): string {
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return getDateKey(yesterday);
}

function getDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = getDateFromKey(dateKey);

  date.setDate(date.getDate() + days);

  return getDateKey(date);
}

function isSameOrBeforeDateKey(
  dateKey: string,
  compareDateKey: string,
): boolean {
  return dateKey.localeCompare(compareDateKey) <= 0;
}

function normalizeTimestamp(raw: unknown): number {
  if (!raw) {
    return Date.now();
  }

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
        [
          userId,
        ],
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
    [
      id,
    ],
  );
}

export async function insertAlarmStreakEventCloud(
  event: AlarmStreakEvent,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id || session.user.id !== event.userId) {
    throw new Error('No hay sesion Supabase valida para sincronizar racha.');
  }

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

async function syncUnsyncedAlarmStreakEvents(
  userId: string,
): Promise<void> {
  const unsyncedEvents = getUnsyncedAlarmStreakEventsLocal(userId);

  for (const event of unsyncedEvents) {
    try {
      await insertAlarmStreakEventCloud(event);
      markAlarmStreakEventAsSyncedLocal(event.id);
    } catch (error) {
      console.log(
        '[Streak] Evento de racha pendiente de sincronizar:',
        error,
      );
      return;
    }
  }
}

async function saveAlarmStreakEvent(
  event: AlarmStreakEvent,
): Promise<void> {
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

export async function recordAlarmStreakEvent(
  input: CreateAlarmStreakEventInput,
): Promise<void> {
  const event = buildAlarmStreakEvent(input);

  await saveAlarmStreakEvent(event);
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

function getDayStatusMap(
  events: AlarmStreakEvent[],
): Map<string, StreakEventType> {
  const byDay = new Map<string, StreakEventType>();
  const priority: Record<StreakEventType, number> = {
    frozen: 1,
    missed: 2,
    completed: 3,
  };

  events.forEach(event => {
    const eventType = getEffectiveEventType(event);
    const current = byDay.get(event.eventDate);

    if (
      current &&
      priority[current] >= priority[eventType]
    ) {
      return;
    }

    byDay.set(event.eventDate, eventType);
  });

  return byDay;
}

function getEffectiveEventType(event: AlarmStreakEvent): StreakEventType {
  if (
    event.eventType === 'missed' &&
    !event.alarmId &&
    !event.alarmTime
  ) {
    return 'frozen';
  }

  return event.eventType;
}

function getEffectiveDayStatus(
  events: AlarmStreakEvent[],
  dateKey: string,
): StreakEventType | null {
  return getDayStatusMap(events).get(dateKey) ?? null;
}

function calculateCurrentStreak(
  events: AlarmStreakEvent[],
): number {
  if (events.length === 0) {
    return 0;
  }

  const byDay = getDayStatusMap(events);
  const todayKey = getTodayDateKey();
  const todayStatus = byDay.get(todayKey);
  let cursorDateKey =
    todayStatus === 'completed' || todayStatus === 'frozen'
      ? todayKey
      : getYesterdayDateKey();
  let streak = 0;
  let foundCompletedDay = false;

  while (true) {
    const status = byDay.get(cursorDateKey);

    if (status === 'missed') {
      return foundCompletedDay ? streak : 0;
    }

    if (status === 'completed') {
      streak += 1;
      foundCompletedDay = true;
    }

    if (!status) {
      return foundCompletedDay ? streak : 0;
    }

    const previousDateKey = addDaysToDateKey(cursorDateKey, -1);

    if (!byDay.has(previousDateKey)) {
      return foundCompletedDay ? streak : 0;
    }

    cursorDateKey = previousDateKey;
  }
}

function calculateBestStreak(
  events: AlarmStreakEvent[],
): number {
  if (events.length === 0) {
    return 0;
  }

  const byDay = getDayStatusMap(events);
  const allDates = Array.from(byDay.keys()).sort();

  let best = 0;
  let current = 0;
  let previousDateKey: string | null = null;

  allDates.forEach(dateKey => {
    const status = byDay.get(dateKey);

    if (
      previousDateKey &&
      addDaysToDateKey(previousDateKey, 1) !== dateKey
    ) {
      current = 0;
    }

    if (status === 'completed') {
      current += 1;
      best = Math.max(best, current);
      previousDateKey = dateKey;
      return;
    }

    if (status === 'frozen') {
      previousDateKey = dateKey;
      return;
    }

    if (status === 'missed') {
      current = 0;
      previousDateKey = dateKey;
    }
  });

  return best;
}

function getProtectionsAvailable(_events: AlarmStreakEvent[]): number {
  return 0;
}

async function reconcileMissingStreakDays(
  userId: string,
  events: AlarmStreakEvent[],
): Promise<AlarmStreakEvent[]> {
  if (events.length === 0) {
    return events;
  }

  const byDay = getDayStatusMap(events);
  const eventDates = Array.from(byDay.keys()).sort();

  if (eventDates.length === 0) {
    return events;
  }

  const yesterdayKey = getYesterdayDateKey();
  const firstDateKey = eventDates[0];
  let cursorDateKey = addDaysToDateKey(firstDateKey, 1);

  if (!isSameOrBeforeDateKey(cursorDateKey, yesterdayKey)) {
    return events;
  }

  const generatedEvents: AlarmStreakEvent[] = [];

  while (isSameOrBeforeDateKey(cursorDateKey, yesterdayKey)) {
    const alreadyHasEvent =
      byDay.has(cursorDateKey) ||
      generatedEvents.some(
        event => event.eventDate === cursorDateKey,
    );

    if (!alreadyHasEvent) {
      const generatedEvent = buildAlarmStreakEvent({
        userId,
        alarmId: null,
        alarmTime: null,
        eventType: 'frozen',
        eventDate: cursorDateKey,
        usedProtection: false,
        protectionsBefore: 0,
        protectionsAfter: 0,
      });

      await saveAlarmStreakEvent(generatedEvent);

      generatedEvents.push(generatedEvent);
    }

    cursorDateKey = addDaysToDateKey(cursorDateKey, 1);
  }

  return mergeEvents(events, generatedEvents);
}

export async function getStreakSummary(
  userId: string,
): Promise<StreakSummary> {
  const localEvents = getAlarmStreakEventsLocal(userId);

  let events = localEvents;

  try {
    await syncUnsyncedAlarmStreakEvents(userId);

    const cloudEvents = await getAlarmStreakEventsCloud(userId);

    cloudEvents.forEach(event => {
      insertAlarmStreakEventLocal(event, true);
    });

    events = mergeEvents(localEvents, cloudEvents);
  } catch (error) {
    console.log('[Streak] No se pudo sincronizar resumen:', error);
  }

  events = await reconcileMissingStreakDays(userId, events);

  const todayKey = getTodayDateKey();
  const todayStatus = getEffectiveDayStatus(events, todayKey);

  return {
    currentStreak: calculateCurrentStreak(events),
    bestStreak: calculateBestStreak(events),
    successfulAlarms: events.filter(
      event => event.eventType === 'completed',
    ).length,
    protectionsAvailable: getProtectionsAvailable(events),
    protectionsUsed: 0,
    todayStatus,
    events,
  };
}

export async function recordCompletedAlarmStreak(input: {
  userId: string;
  alarmId?: string | null;
  alarmTime?: string | null;
}): Promise<void> {
  const summary = await getStreakSummary(input.userId);
  const todayKey = getTodayDateKey();
  const todayStatus = getEffectiveDayStatus(summary.events, todayKey);

  if (todayStatus === 'completed') {
    return;
  }

  await recordAlarmStreakEvent({
    userId: input.userId,
    alarmId: input.alarmId ?? null,
    alarmTime: input.alarmTime ?? null,
    eventType: 'completed',
    eventDate: todayKey,
    protectionsBefore: 0,
    protectionsAfter: 0,
  });
}

export async function recordMissedOrFrozenAlarm(input: {
  userId: string;
  alarmId?: string | null;
  alarmTime?: string | null;
}): Promise<StreakEventType> {
  const summary = await getStreakSummary(input.userId);
  const todayKey = getTodayDateKey();
  const todayStatus = getEffectiveDayStatus(summary.events, todayKey);

  if (todayStatus === 'missed') {
    return todayStatus;
  }

  await recordAlarmStreakEvent({
    userId: input.userId,
    alarmId: input.alarmId ?? null,
    alarmTime: input.alarmTime ?? null,
    eventType: 'missed',
    eventDate: todayKey,
    usedProtection: false,
    protectionsBefore: 0,
    protectionsAfter: 0,
  });

  return 'missed';
}
