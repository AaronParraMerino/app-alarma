import db from '../../db/localDB'
import { Alarm } from '../../../features/alarm/types/alarm.types'

// 🔁 Mapper
const mapRowToAlarm = (row: any): Alarm => ({
  id: row.id,
  hour: parseInt(row.time.split(':')[0]),
  minute: parseInt(row.time.split(':')[1]),
  label: '',
  enabled: row.active === 1,
  repeatDays: [],
  missions: [],
  randomMissions: false,
  soundUri: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export const insertAlarmLocal = (alarm: Alarm) => {
  const time = `${alarm.hour}:${alarm.minute}`

  db.runSync(
    `INSERT OR REPLACE INTO alarms (id, time, active, synced)
     VALUES (?, ?, ?, ?)`,
    [alarm.id, time, alarm.enabled ? 1 : 0, 0]
  )
}

export const getUnsyncedAlarms = (): Alarm[] => {
  const rows = db.getAllSync(`SELECT * FROM alarms WHERE synced = 0`)
  return rows.map(mapRowToAlarm)
}

export const markAsSynced = (id: string) => {
  db.runSync(`UPDATE alarms SET synced = 1 WHERE id = ?`, [id])
}