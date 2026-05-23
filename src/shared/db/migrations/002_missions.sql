-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Current Supabase table snapshot: public.missions_history and public.word_completion_words.

CREATE TABLE public.missions_history (
  id bigint NOT NULL DEFAULT nextval('missions_history_id_seq'::regclass),
  sync_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  mission_type text NOT NULL,
  difficulty text,
  content jsonb NOT NULL,
  correct_answer text NOT NULL,
  user_answer text NOT NULL,
  success boolean NOT NULL,
  error_count integer DEFAULT 0,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT missions_history_pkey PRIMARY KEY (id),
  CONSTRAINT missions_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.word_completion_words (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  word text NOT NULL,
  difficulty text,
  CONSTRAINT word_completion_words_pkey PRIMARY KEY (id)
);
