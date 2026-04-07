import { Alarm } from '../../../features/alarm/types/alarm.types'

import {
  getUnsyncedAlarms,
  markAsSynced,
  insertAlarmLocal,
} from './localDB.service'

import {
  insertAlarmCloud,
  getAlarmsCloud,
} from './cloudDB.service'

import NetInfo from '@react-native-community/netinfo'

// 🔌 Verificar conexión
const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch()
  return !!state.isConnected
}

// 🔄 Sync principal
export const syncAlarms = async (): Promise<void> => {
  try {
    const online = await isOnline()

    if (!online) {
      console.log('🔌 Sin internet, se omite sync')
      return
    }

    // 🔼 1. Subir pendientes (local → nube)
    const unsynced = getUnsyncedAlarms() as Alarm[]

    for (const alarm of unsynced) {
      await insertAlarmCloud(alarm)
      markAsSynced(alarm.id)
    }

    // 🔽 2. Descargar datos (nube → local)
    const cloudData = (await getAlarmsCloud()) as Alarm[]

    for (const alarm of cloudData) {
      insertAlarmLocal({
        ...alarm,
        enabled: !!alarm.enabled,
      })
    }

    console.log('✅ Sync completado')

  } catch (error) {
    console.log('❌ Sync error:', error)
  }
}