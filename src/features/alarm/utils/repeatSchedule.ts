import { Alarm, RepeatDay } from '../types/alarm.types';

export const ALL_REPEAT_DAYS: RepeatDay[] = [0, 1, 2, 3, 4, 5, 6];

export function normalizeRepeatDays(
  days: readonly number[] | null | undefined,
): RepeatDay[] {
  return Array.from(
    new Set(
      (days ?? []).filter(
        (day): day is RepeatDay => Number.isInteger(day) && day >= 0 && day <= 6,
      ),
    ),
  ).sort((a, b) => a - b);
}

export function hasRepeatSchedule(days: readonly number[] | null | undefined): boolean {
  return normalizeRepeatDays(days).length > 0;
}

export function shouldDisableAfterAlarmResolution(
  alarm: Pick<Alarm, 'repeatDays'>,
): boolean {
  const repeatDays = normalizeRepeatDays(alarm.repeatDays);

  // [] = one-time alarm. A single selected day is also consumed after it rings;
  // multiple days stay enabled so future selected days can continue firing.
  return repeatDays.length <= 1;
}

export function shouldShowAlarmSwitchOn(
  alarm: Pick<Alarm, 'enabled' | 'repeatDays'>,
): boolean {
  if (!alarm.enabled) return false;

  const hasRawRepeatDays = (alarm.repeatDays ?? []).length > 0;
  return !hasRawRepeatDays || hasRepeatSchedule(alarm.repeatDays);
}

export function getNextAlarmOccurrence(
  alarm: Pick<Alarm, 'enabled' | 'repeatDays' | 'hour' | 'minute'>,
  from: Date = new Date(),
): Date | null {
  if (!shouldShowAlarmSwitchOn(alarm)) return null;

  const repeatDays = normalizeRepeatDays(alarm.repeatDays);

  if (repeatDays.length === 0) {
    const target = new Date(from);
    target.setHours(alarm.hour, alarm.minute, 0, 0);

    if (target <= from) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }

  return repeatDays.reduce<Date | null>((nearest, day) => {
    const candidate = new Date(from);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);

    const daysUntilTarget = (day - from.getDay() + 7) % 7;
    candidate.setDate(from.getDate() + daysUntilTarget);

    if (candidate <= from) {
      candidate.setDate(candidate.getDate() + 7);
    }

    return !nearest || candidate < nearest ? candidate : nearest;
  }, null);
}
