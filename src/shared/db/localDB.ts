import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('app.db')

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS alarms (
      id TEXT PRIMARY KEY NOT NULL,
      time TEXT,
      active INTEGER,
      synced INTEGER DEFAULT 0
    );
  `)
}

export default db