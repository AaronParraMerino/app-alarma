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

    CREATE TABLE IF NOT EXISTS pending_alarm_deletes (
      alarm_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY (alarm_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS word_completion_words (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      word       TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      language   TEXT NOT NULL DEFAULT 'es'
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_word_completion_words_language_unique
    ON word_completion_words(word, difficulty, language);

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

    CREATE TABLE IF NOT EXISTS object_recognition_objects (
      id         TEXT PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL,
      label      TEXT NOT NULL,
      model_label TEXT NOT NULL DEFAULT '',
      min_confidence REAL DEFAULT 0.5,
      category   TEXT NOT NULL,
      enabled    INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_oro_enabled
    ON object_recognition_objects(enabled);

    CREATE INDEX IF NOT EXISTS idx_oro_category
    ON object_recognition_objects(category);


    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

  `);

  ensureColumn('alarms', 'label', "TEXT DEFAULT ''");
  ensureColumn('alarms', 'active', 'INTEGER DEFAULT 1');
  ensureColumn('alarms', 'repeat_days', "TEXT DEFAULT '[]'");
  ensureColumn('alarms', 'missions', "TEXT DEFAULT '[]'");
  ensureColumn('alarms', 'random_missions', 'INTEGER DEFAULT 0');
  ensureColumn('alarms', 'sound_uri', 'TEXT');
  ensureColumn('alarms', 'synced', 'INTEGER DEFAULT 0');
  ensureColumn('alarms', 'created_at', 'INTEGER');
  ensureColumn('alarms', 'updated_at', 'INTEGER');
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
