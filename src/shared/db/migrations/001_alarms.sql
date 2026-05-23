-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Current Supabase table snapshot: public.alarms.

CREATE TABLE public.alarms (
  id text NOT NULL,
  user_id uuid NOT NULL,
  time text NOT NULL,
  label text DEFAULT ''::text,
  active integer DEFAULT 1,
  repeat_days text DEFAULT '[]'::text,
  missions text DEFAULT '[]'::text,
  random_missions integer DEFAULT 0,
  sound_uri text,
  synced integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT alarms_pkey PRIMARY KEY (id),
  CONSTRAINT alarms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
