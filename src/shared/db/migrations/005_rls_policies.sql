-- Run this manually in the Supabase SQL editor.
-- RLS rules required by the app sync layer.

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own alarms" ON public.alarms;
CREATE POLICY "Users can read their own alarms"
ON public.alarms
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own alarms" ON public.alarms;
CREATE POLICY "Users can insert their own alarms"
ON public.alarms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alarms" ON public.alarms;
CREATE POLICY "Users can update their own alarms"
ON public.alarms
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own alarms" ON public.alarms;
CREATE POLICY "Users can delete their own alarms"
ON public.alarms
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own mission history" ON public.missions_history;
CREATE POLICY "Users can read their own mission history"
ON public.missions_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mission history" ON public.missions_history;
CREATE POLICY "Users can insert their own mission history"
ON public.missions_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mission history" ON public.missions_history;
CREATE POLICY "Users can update their own mission history"
ON public.missions_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mission history" ON public.missions_history;
CREATE POLICY "Users can delete their own mission history"
ON public.missions_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);
