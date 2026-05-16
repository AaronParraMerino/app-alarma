import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Alarm, AlarmCreate } from '../types/alarm.types';
import {
  clearPendingAlarmDeleteLocal,
  deleteAlarmLocal,
  enqueueAlarmDeleteLocal,
  getAlarmsLocal,
  insertAlarmLocal,
} from '../../../shared/services/storage/localDB.service';
import { deleteAlarmCloud } from '../../../shared/services/storage/cloudDB.service';
import { initDB } from '../../../shared/db/localDB';
import {
  cancelAlarmNotificationsByAlarmId,
  scheduleAlarmNotifications,
} from '../services/alarmScheduler';
import { useAuth } from '../../auth/hooks/useAuth';

// ─── Context ─────────────────────────────────────────────────────────────────
interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (data: AlarmCreate) => void;
  updateAlarm: (id: string, data: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
}

const AlarmContext = createContext<AlarmContextType | null>(null);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const { isAuthenticated, isGuest, user } = useAuth();
  const userId = isAuthenticated && !isGuest ? user?.id : undefined;

  useEffect(() => {
    initDB();
    const localAlarms = getAlarmsLocal();
    setAlarms(localAlarms);

    localAlarms.forEach(alarm => {
      void scheduleAlarmNotifications(alarm);
    });
  }, []);

  const addAlarm = useCallback((data: AlarmCreate) => {
    const now = Date.now();
    const newAlarm: Alarm = {
      ...data,
      id: now.toString(),
      createdAt: now,
      updatedAt: now,
    };
    setAlarms(prev => [...prev, newAlarm]);
    insertAlarmLocal(newAlarm);
    void scheduleAlarmNotifications(newAlarm);
  }, []);

  const updateAlarm = useCallback((id: string, data: Partial<Alarm>) => {
    setAlarms(prev => {
      const oldAlarm = prev.find(a => a.id === id);
      const next = prev.map(a =>
        a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a,
      );
      const updated = next.find(a => a.id === id);
      if (updated) insertAlarmLocal(updated);
      if (oldAlarm) void cancelAlarmNotificationsByAlarmId(oldAlarm.id);
      if (updated) void scheduleAlarmNotifications(updated);
      return next;
    });
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
    if (userId) {
      enqueueAlarmDeleteLocal(id, userId);
      void deleteAlarmCloud(id, userId)
        .then(() => clearPendingAlarmDeleteLocal(id, userId))
        .catch(error => {
          console.log('[AlarmStore] Delete cloud pending sync:', error);
        });
    }
    deleteAlarmLocal(id);
    void cancelAlarmNotificationsByAlarmId(id);
  }, [userId]);

  const toggleAlarm = useCallback((id: string) => {
    setAlarms(prev => {
      const next = prev.map(a =>
        a.id === id
          ? { ...a, enabled: !a.enabled, updatedAt: Date.now() }
          : a,
      );
      const updated = next.find(a => a.id === id);
      if (updated) insertAlarmLocal(updated);
      if (updated) void scheduleAlarmNotifications(updated);
      return next;
    });
  }, []);

  return (
    <AlarmContext.Provider
      value={{ alarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarmStore() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarmStore must be used within AlarmProvider');
  return ctx;
}
