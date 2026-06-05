// src/shared/db/localDB.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('app.db');

function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  const exists = columns.some(item => item.name === column);

  if (exists) return;

  db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS alarms (
      id              TEXT PRIMARY KEY NOT NULL,
      user_id         TEXT,
      time            TEXT NOT NULL,
      label           TEXT DEFAULT '',
      active          INTEGER DEFAULT 1,
      repeat_days     TEXT DEFAULT '[]',
      missions        TEXT DEFAULT '[]',
      random_missions INTEGER DEFAULT 0,
      sound_uri       TEXT,
      min_volume_percent INTEGER DEFAULT 100,
      vibration_enabled INTEGER DEFAULT 0,
      vibration_pattern TEXT DEFAULT 'classic',
      synced          INTEGER DEFAULT 0,
      created_at      INTEGER DEFAULT (strftime('%s','now')),
      updated_at      INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS pending_alarm_deletes (
      alarm_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY (alarm_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS alarm_history (
      id              TEXT PRIMARY KEY NOT NULL,
      alarm_id        TEXT NOT NULL,
      user_id         TEXT NOT NULL,
      action          TEXT NOT NULL CHECK (
        action IN (
          'created',
          'enabled',
          'disabled',
          'updated',
          'deleted'
        )
      ),
      time            TEXT NOT NULL,
      label           TEXT DEFAULT '',
      repeat_days     TEXT DEFAULT '[]',
      missions        TEXT DEFAULT '[]',
      random_missions INTEGER DEFAULT 0,
      sound_uri       TEXT,
      enabled         INTEGER DEFAULT 0,
      synced          INTEGER DEFAULT 0,
      created_at      INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_alarm_history_user_created_at
    ON alarm_history(user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_alarm_history_synced
    ON alarm_history(synced);

    CREATE TABLE IF NOT EXISTS alarm_streak_events (
      id                 TEXT PRIMARY KEY NOT NULL,
      user_id            TEXT NOT NULL,
      alarm_id           TEXT,
      event_type         TEXT NOT NULL CHECK (
        event_type IN (
          'completed',
          'missed',
          'frozen'
        )
      ),
      alarm_time         TEXT,
      event_date         TEXT NOT NULL,
      used_protection    INTEGER DEFAULT 0,
      protections_before INTEGER DEFAULT 0,
      protections_after  INTEGER DEFAULT 0,
      synced             INTEGER DEFAULT 0,
      created_at         INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_alarm_streak_events_user_date
    ON alarm_streak_events(user_id, event_date DESC);

    CREATE INDEX IF NOT EXISTS idx_alarm_streak_events_synced
    ON alarm_streak_events(synced);

    CREATE TABLE IF NOT EXISTS word_completion_words (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      word       TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      language   TEXT NOT NULL DEFAULT 'es'
    );

    CREATE TABLE IF NOT EXISTS missions_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_id TEXT UNIQUE,

      user_id TEXT NOT NULL,

      mission_type TEXT NOT NULL,
      difficulty TEXT,

      content TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      user_answer TEXT NOT NULL,

      success INTEGER NOT NULL,
      error_count INTEGER DEFAULT 0,
      duration_seconds INTEGER,

      created_at INTEGER DEFAULT (strftime('%s','now')),
      synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_mh_synced
    ON missions_history(synced);

    CREATE TABLE IF NOT EXISTS object_recognition_objects (
      id             TEXT PRIMARY KEY NOT NULL,
      name           TEXT NOT NULL,
      label          TEXT NOT NULL,
      model_label    TEXT NOT NULL DEFAULT '',
      min_confidence REAL DEFAULT 0.5,
      category       TEXT NOT NULL,
      enabled        INTEGER DEFAULT 1,
      created_at     INTEGER DEFAULT (strftime('%s','now')),
      updated_at     INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_oro_enabled
    ON object_recognition_objects(enabled);

    CREATE INDEX IF NOT EXISTS idx_oro_category
    ON object_recognition_objects(category);

    CREATE TABLE IF NOT EXISTS trivia_custom_questions (
      id                     TEXT PRIMARY KEY NOT NULL,
      category               TEXT NOT NULL,
      prompt_es              TEXT NOT NULL,
      prompt_en              TEXT NOT NULL,
      options_es             TEXT NOT NULL DEFAULT '[]',
      options_en             TEXT NOT NULL DEFAULT '[]',
      correct_option_indexes TEXT NOT NULL DEFAULT '[]',
      accepted_answers_es    TEXT NOT NULL DEFAULT '[]',
      accepted_answers_en    TEXT NOT NULL DEFAULT '[]',
      created_at             INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trivia_custom_questions_category
    ON trivia_custom_questions(category);

    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  ensureColumn('alarms', 'label', "TEXT DEFAULT ''");
  ensureColumn('alarms', 'user_id', 'TEXT');
  ensureColumn('alarms', 'active', 'INTEGER DEFAULT 1');
  ensureColumn('alarms', 'repeat_days', "TEXT DEFAULT '[]'");
  ensureColumn('alarms', 'missions', "TEXT DEFAULT '[]'");
  ensureColumn('alarms', 'random_missions', 'INTEGER DEFAULT 0');
  ensureColumn('alarms', 'sound_uri', 'TEXT');
  ensureColumn('alarms', 'min_volume_percent', 'INTEGER DEFAULT 100');
  ensureColumn('alarms', 'vibration_enabled', 'INTEGER DEFAULT 0');
  ensureColumn('alarms', 'vibration_pattern', "TEXT DEFAULT 'classic'");
  ensureColumn('alarms', 'synced', 'INTEGER DEFAULT 0');
  ensureColumn('alarms', 'created_at', 'INTEGER');
  ensureColumn('alarms', 'updated_at', 'INTEGER');

  ensureColumn('alarm_history', 'alarm_id', 'TEXT');
  ensureColumn('alarm_history', 'user_id', 'TEXT');
  ensureColumn('alarm_history', 'action', 'TEXT');
  ensureColumn('alarm_history', 'time', 'TEXT');
  ensureColumn('alarm_history', 'label', "TEXT DEFAULT ''");
  ensureColumn('alarm_history', 'repeat_days', "TEXT DEFAULT '[]'");
  ensureColumn('alarm_history', 'missions', "TEXT DEFAULT '[]'");
  ensureColumn('alarm_history', 'random_missions', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_history', 'sound_uri', 'TEXT');
  ensureColumn('alarm_history', 'enabled', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_history', 'synced', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_history', 'created_at', 'INTEGER');

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_alarm_history_user_created_at
    ON alarm_history(user_id, created_at DESC);
  `);

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_alarm_history_synced
    ON alarm_history(synced);
  `);

  ensureColumn('alarm_streak_events', 'user_id', 'TEXT');
  ensureColumn('alarm_streak_events', 'alarm_id', 'TEXT');
  ensureColumn('alarm_streak_events', 'event_type', 'TEXT');
  ensureColumn('alarm_streak_events', 'alarm_time', 'TEXT');
  ensureColumn('alarm_streak_events', 'event_date', 'TEXT');
  ensureColumn('alarm_streak_events', 'used_protection', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_streak_events', 'protections_before', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_streak_events', 'protections_after', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_streak_events', 'synced', 'INTEGER DEFAULT 0');
  ensureColumn('alarm_streak_events', 'created_at', 'INTEGER');

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_alarm_streak_events_user_date
    ON alarm_streak_events(user_id, event_date DESC);
  `);

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_alarm_streak_events_synced
    ON alarm_streak_events(synced);
  `);

  ensureColumn('word_completion_words', 'language', "TEXT NOT NULL DEFAULT 'es'");

  db.execSync(`DROP INDEX IF EXISTS idx_word_completion_words_unique`);

  db.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_word_completion_words_language_unique
    ON word_completion_words(word, difficulty, language);
  `);

  ensureColumn('object_recognition_objects', 'model_label', "TEXT DEFAULT ''");
  ensureColumn('object_recognition_objects', 'min_confidence', 'REAL DEFAULT 0.5');
};

export default db;
