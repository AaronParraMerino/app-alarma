import NetInfo from '@react-native-community/netinfo';
import { Alarm } from '../../../features/alarm/types/alarm.types';
import {
  clearPendingAlarmDeleteLocal,
  getAlarmsLocal,
  getPendingAlarmDeletes,
  getUnsyncedAlarms,
  markAsSynced,
  insertAlarmLocal,
} from './localDB.service';
import { insertAlarmCloud, getAlarmsCloud, deleteAlarmCloud } from './cloudDB.service';

let unsubscribeNetInfo: (() => void) | null = null;
let isSyncing = false;
const alarmSyncListeners = new Set<() => void>();

export const subscribeAlarmSync = (listener: () => void): (() => void) => {
  alarmSyncListeners.add(listener);
  return () => {
    alarmSyncListeners.delete(listener);
  };
};

const notifyAlarmSyncListeners = (): void => {
  alarmSyncListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.log('[Sync] Error notificando cambios locales:', error);
    }
  });
};

const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
};

export const syncAlarms = async (userId: string): Promise<void> => {
  // Validar userId antes de cualquier cosa
  if (!userId || userId === 'undefined') {
    console.log('[Sync] userId inválido, se omite sync');
    return;
  }
  if (isSyncing) return;
  isSyncing = true;

  try {
    const online = await isOnline();
    if (!online) {
      console.log('[Sync] Sin internet, se omite sync');
      return;
    }

    const pendingDeletes = getPendingAlarmDeletes(userId);
    if (pendingDeletes.length > 0) {
      console.log(`[Sync] Borrando ${pendingDeletes.length} alarmas pendientes...`);
      for (const alarmId of pendingDeletes) {
        await deleteAlarmCloud(alarmId, userId);
        clearPendingAlarmDeleteLocal(alarmId, userId);
      }
    }

    const unsynced = getUnsyncedAlarms() as Alarm[];
    if (unsynced.length > 0) {
      console.log(`[Sync] Subiendo ${unsynced.length} alarmas pendientes...`);
      for (const alarm of unsynced) {
        await insertAlarmCloud({ ...alarm, user_id: userId });
        markAsSynced(alarm.id);
      }
    }

    const cloudData = (await getAlarmsCloud(userId)) as Alarm[];
    if (cloudData.length > 0) {
      console.log(`[Sync] Descargando ${cloudData.length} alarmas de la nube...`);
      const localAlarms = getAlarmsLocal();
      for (const alarm of cloudData) {
        const localAlarm = localAlarms.find(item => item.id === alarm.id);
        const cloudHasVibration =
          (alarm as any).vibrationEnabled !== undefined ||
          (alarm as any).vibration_enabled !== undefined;

        insertAlarmLocal(
          {
            ...alarm,
            enabled: !!alarm.enabled,
            vibrationEnabled: cloudHasVibration
              ? alarm.vibrationEnabled ?? Boolean((alarm as any).vibration_enabled)
              : localAlarm?.vibrationEnabled ?? true,
          },
          { synced: true },
        );
      }
    }

    console.log('[Sync] Completado correctamente');
    notifyAlarmSyncListeners();
  } catch (error) {
    console.log('[Sync] Error:', error);
  } finally {
    isSyncing = false;
  }
};

export const startSyncListener = (userId: string): void => {
  if (unsubscribeNetInfo) return;
  if (!userId || userId === 'undefined') return;

  console.log('[Sync] Listener iniciado');

  let isFirstEvent = true; // ← clave: ignora el primer disparo automático

  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    // El listener siempre dispara inmediatamente con el estado actual
    // ignoramos ese primer disparo porque el sync ya se hizo en login/register
    if (isFirstEvent) {
      isFirstEvent = false;
      return;
    }

    const online = !!state.isConnected && state.isInternetReachable !== false;
    if (online) {
      console.log('[Sync] Reconexión detectada, sincronizando...');
      syncAlarms(userId);
    }
  });
};

export const stopSyncListener = (): void => {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
    console.log('[Sync] Listener detenido');
  }
};
