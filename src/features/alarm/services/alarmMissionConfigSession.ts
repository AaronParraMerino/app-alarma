import { AlarmMission } from '../types/alarm.types';

type ConfigCallback = (mission: AlarmMission) => void;

const callbacks = new Map<string, ConfigCallback>();

export function registerAlarmMissionConfigSession(callback: ConfigCallback): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  callbacks.set(id, callback);
  return id;
}

export function completeAlarmMissionConfigSession(
  id: string | undefined,
  mission: AlarmMission,
): boolean {
  if (!id) return false;

  const callback = callbacks.get(id);
  if (!callback) return false;

  callback(mission);
  callbacks.delete(id);
  return true;
}

export function cancelAlarmMissionConfigSession(id: string | undefined): void {
  if (!id) return;
  callbacks.delete(id);
}
