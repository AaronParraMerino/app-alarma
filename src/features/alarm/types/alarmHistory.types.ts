// src/features/alarm/types/alarmHistory.types.ts
import {
  AlarmMission,
  RepeatDay,
} from './alarm.types';

export type AlarmHistoryAction =
  | 'created'
  | 'enabled'
  | 'disabled'
  | 'updated'
  | 'deleted';

export interface AlarmHistoryEvent {
  id: string;
  alarmId: string;
  userId: string;
  action: AlarmHistoryAction;
  hour: number;
  minute: number;
  label: string;
  repeatDays: RepeatDay[];
  missions: AlarmMission[];
  randomMissions: boolean;
  soundUri: string | null;
  enabled: boolean;
  createdAt: number;
  synced?: boolean;
}

export interface CreateAlarmHistoryEventInput {
  alarmId: string;
  userId: string;
  action: AlarmHistoryAction;
  hour: number;
  minute: number;
  label?: string;
  repeatDays?: RepeatDay[];
  missions?: AlarmMission[];
  randomMissions?: boolean;
  soundUri?: string | null;
  enabled?: boolean;
  createdAt?: number;
}

export const ALARM_HISTORY_ACTION_LABELS: Record<AlarmHistoryAction, string> = {
  created: 'Alarma creada',
  enabled: 'Alarma activada',
  disabled: 'Alarma desactivada',
  updated: 'Alarma editada',
  deleted: 'Alarma eliminada',
};

export const ALARM_HISTORY_STATUS_LABELS: Record<AlarmHistoryAction, string> = {
  created: 'Creada',
  enabled: 'Activada',
  disabled: 'Desactivada',
  updated: 'Editada',
  deleted: 'Eliminada',
};