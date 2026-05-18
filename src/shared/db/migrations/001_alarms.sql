CREATE TABLE alarms (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time         TEXT NOT NULL,
  label        TEXT DEFAULT '',
  active       INTEGER DEFAULT 1,
  repeat_days  TEXT DEFAULT '[]',
  missions     TEXT DEFAULT '[]',
  random_missions INTEGER DEFAULT 0,
  sound_uri    TEXT,
  synced       INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver propias alarmas"    ON alarms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "crear alarmas"          ON alarms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editar alarmas"         ON alarms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "eliminar alarmas"       ON alarms FOR DELETE USING (auth.uid() = user_id);