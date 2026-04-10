
-- Add requires_watch column to tasks
ALTER TABLE public.tasks ADD COLUMN requires_watch boolean NOT NULL DEFAULT false;

-- Create watch progress table
CREATE TABLE public.task_watch_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  watched_seconds jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, player_id)
);

-- Enable RLS
ALTER TABLE public.task_watch_progress ENABLE ROW LEVEL SECURITY;

-- Players can view own progress
CREATE POLICY "Players can view own watch progress"
ON public.task_watch_progress FOR SELECT
TO authenticated
USING (auth.uid() = player_id);

-- Coach can view all progress
CREATE POLICY "Coach can view all watch progress"
ON public.task_watch_progress FOR SELECT
TO authenticated
USING (is_coach(auth.uid()));

-- Players can insert own progress
CREATE POLICY "Players can insert own watch progress"
ON public.task_watch_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

-- Players can update own progress
CREATE POLICY "Players can update own watch progress"
ON public.task_watch_progress FOR UPDATE
TO authenticated
USING (auth.uid() = player_id);

-- Coach can delete progress
CREATE POLICY "Coach can delete watch progress"
ON public.task_watch_progress FOR DELETE
TO authenticated
USING (is_coach(auth.uid()));

-- Update timestamp trigger
CREATE TRIGGER update_task_watch_progress_updated_at
BEFORE UPDATE ON public.task_watch_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
