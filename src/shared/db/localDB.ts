import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('app.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS alarms (
      id              TEXT PRIMARY KEY NOT NULL,
      time            TEXT NOT NULL,
      label           TEXT DEFAULT '',
      active          INTEGER DEFAULT 1,
      repeat_days     TEXT DEFAULT '[]',
      missions        TEXT DEFAULT '[]',
      random_missions INTEGER DEFAULT 0,
      sound_uri       TEXT,
      synced          INTEGER DEFAULT 0,
      created_at      INTEGER DEFAULT (strftime('%s','now')),
      updated_at      INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
};

export default db;