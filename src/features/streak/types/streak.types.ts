// src/features/streak/types/streak.types.ts

export type StreakEventType = 'completed' | 'missed' | 'frozen';

export interface AlarmStreakEvent {
  id: string;
  userId: string;
  alarmId: string | null;
  eventType: StreakEventType;
  alarmTime: string | null;
  eventDate: string;
  usedProtection: boolean;
  protectionsBefore: number;
  protectionsAfter: number;
  createdAt: number;
  synced?: boolean;
}

export interface CreateAlarmStreakEventInput {
  userId: string;
  alarmId?: string | null;
  eventType: StreakEventType;
  alarmTime?: string | null;
  eventDate?: string;
  usedProtection?: boolean;
  protectionsBefore?: number;
  protectionsAfter?: number;
  createdAt?: number;
}

export interface StreakSummary {
  currentStreak: number;
  bestStreak: number;
  successfulAlarms: number;
  protectionsAvailable: number;
  protectionsUsed: number;
  todayStatus: StreakEventType | null;
  events: AlarmStreakEvent[];
}