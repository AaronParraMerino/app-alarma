// src/features/alarm/store/alarmStore.tsx
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
  getAllAlarmsLocal,
  getAlarmsLocal,
  insertAlarmLocal,
} from '../../../shared/services/storage/localDB.service';
import { deleteAlarmCloud } from '../../../shared/services/storage/cloudDB.service';
import { initDB } from '../../../shared/db/localDB';
import {
  cancelAlarmNotificationsByAlarmId,
  clearResolvedRingingAlarmByAlarmId,
  scheduleAlarmNotifications,
} from '../services/alarmScheduler';
import { useAuth } from '../../auth/hooks/useAuth';
import { subscribeAlarmSync } from '../../../shared/services/storage/sync.service';
import { incrementTotalAlarmsCreated } from '../../../shared/services/profile/profile.service';
import { recordAlarmHistory } from '../services/alarmHistory';

interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (data: AlarmCreate) => void;
  updateAlarm: (id: string, data: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  reloadAlarms: () => void;
}

const AlarmContext = createContext<AlarmContextType | null>(null);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const { isAuthenticated, isGuest, user } = useAuth();

  const userId = isAuthenticated && !isGuest ? user?.id : undefined;

  const reloadLocalAlarms = useCallback(() => {
    const localAlarms = getAlarmsLocal(userId ?? null);
    const visibleAlarmIds = new Set(localAlarms.map(alarm => alarm.id));

    getAllAlarmsLocal()
      .filter(alarm => !visibleAlarmIds.has(alarm.id))
      .forEach(alarm => {
        void cancelAlarmNotificationsByAlarmId(alarm.id);
      });

    setAlarms(localAlarms);

    localAlarms.forEach(alarm => {
      void scheduleAlarmNotifications(alarm);
    });
  }, [userId]);

  useEffect(() => {
    initDB();
    reloadLocalAlarms();
  }, [reloadLocalAlarms]);

  useEffect(() => subscribeAlarmSync(reloadLocalAlarms), [reloadLocalAlarms]);

  const addAlarm = useCallback(
    (data: AlarmCreate) => {
      const now = Date.now();

      const newAlarm: Alarm = {
        ...data,
        id: now.toString(),
        createdAt: now,
        updatedAt: now,
      };

      setAlarms(prev => [...prev, newAlarm]);

      insertAlarmLocal(newAlarm, {
        userId: userId ?? null,
      });

      if (userId) {
        void incrementTotalAlarmsCreated(userId).catch(error => {
          console.log(
            '[AlarmStore] No se pudo incrementar total de alarmas creadas:',
            error,
          );
        });

        void recordAlarmHistory(newAlarm, userId, 'created');
      }

      void scheduleAlarmNotifications(newAlarm);
    },
    [userId],
  );

  const updateAlarm = useCallback(
    (id: string, data: Partial<Alarm>) => {
      setAlarms(prev => {
        const oldAlarm =
          prev.find(a => a.id === id) ??
          getAlarmsLocal(userId ?? null).find(a => a.id === id);

        if (!oldAlarm) return prev;

        const updated: Alarm = {
          ...oldAlarm,
          ...data,
          updatedAt: Date.now(),
        };

        const next = prev.some(a => a.id === id)
          ? prev.map(a => (a.id === id ? updated : a))
          : [...prev, updated];

        insertAlarmLocal(updated, {
          userId: userId ?? null,
        });

        if (userId) {
          void recordAlarmHistory(updated, userId, 'updated');
        }

        void cancelAlarmNotificationsByAlarmId(oldAlarm.id);

        void (async () => {
          if (updated.enabled && data.enabled !== false) {
            await clearResolvedRingingAlarmByAlarmId(updated.id);
          }

          await scheduleAlarmNotifications(updated);
        })();

        return next;
      });
    },
    [userId],
  );

  const deleteAlarm = useCallback(
    (id: string) => {
      setAlarms(prev => {
        const alarmToDelete =
          prev.find(a => a.id === id) ??
          getAlarmsLocal(userId ?? null).find(a => a.id === id);

        if (alarmToDelete && userId) {
          void recordAlarmHistory(alarmToDelete, userId, 'deleted');
        }

        return prev.filter(a => a.id !== id);
      });

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
    },
    [userId],
  );

  const toggleAlarm = useCallback(
    (id: string) => {
      setAlarms(prev => {
        const next = prev.map(a =>
          a.id === id
            ? {
                ...a,
                enabled: !a.enabled,
                updatedAt: Date.now(),
              }
            : a,
        );

        const updated = next.find(a => a.id === id);

        if (updated) {
          insertAlarmLocal(updated, {
            userId: userId ?? null,
          });
        }

        if (updated && userId) {
          void recordAlarmHistory(
            updated,
            userId,
            updated.enabled ? 'enabled' : 'disabled',
          );
        }

        if (updated) {
          void (async () => {
            if (updated.enabled) {
              await clearResolvedRingingAlarmByAlarmId(updated.id);
            }

            await scheduleAlarmNotifications(updated);
          })();
        }

        return next;
      });
    },
    [userId],
  );

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        addAlarm,
        updateAlarm,
        deleteAlarm,
        toggleAlarm,
        reloadAlarms: reloadLocalAlarms,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarmStore() {
  const ctx = useContext(AlarmContext);

  if (!ctx) {
    throw new Error('useAlarmStore must be used within AlarmProvider');
  }

  return ctx;
}
