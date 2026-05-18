CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  bio         TEXT,
  total_alarms_completed  INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver propio perfil"    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "crear propio perfil"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "editar propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);