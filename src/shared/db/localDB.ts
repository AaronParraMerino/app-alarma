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

    CREATE TABLE IF NOT EXISTS word_completion_words (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      word       TEXT NOT NULL,
      difficulty TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_word_completion_words_unique
    ON word_completion_words(word, difficulty);

    CREATE TABLE IF NOT EXISTS missions_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_id TEXT UNIQUE,              -- identidad global

      user_id TEXT NOT NULL,

      mission_type TEXT NOT NULL,
      difficulty TEXT,

      content TEXT NOT NULL,            -- JSON
      correct_answer TEXT NOT NULL,
      user_answer TEXT NOT NULL,

      success INTEGER NOT NULL,         -- 0/1
      error_count INTEGER DEFAULT 0,
      duration_seconds INTEGER,

      created_at INTEGER DEFAULT (strftime('%s','now')),
      synced INTEGER DEFAULT 0          -- 0 = pendiente, 1 = ok
    );

    CREATE INDEX IF NOT EXISTS idx_mh_synced ON missions_history(synced);


    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

  `);
};

export default db;