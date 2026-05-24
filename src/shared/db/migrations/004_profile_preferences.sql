-- Run this manually in the Supabase SQL editor when updating the real database.
-- It keeps app appearance and language preferences attached to each profile.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'es';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_theme_mode_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_theme_mode_check
      CHECK (theme_mode IN ('dark', 'light'))
      NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_language_check
      CHECK (language IN ('es', 'en'))
      NOT VALID;
  END IF;
END $$;
