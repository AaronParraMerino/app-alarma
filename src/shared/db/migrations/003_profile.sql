-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Current Supabase table snapshot: public.profiles.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  bio text,
  theme_mode text DEFAULT 'dark'::text,
  language text DEFAULT 'es'::text,
  total_alarms_completed integer DEFAULT 0,
  total_missions_completed integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
