
-- Add media columns to tasks
ALTER TABLE public.tasks
  ADD COLUMN youtube_url text,
  ADD COLUMN link_url text,
  ADD COLUMN photo_url text,
  ADD COLUMN pdf_url text;

-- Create task-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('task-media', 'task-media', true);

CREATE POLICY "Task media publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-media');

CREATE POLICY "Coaches can upload task media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-media' AND public.is_coach(auth.uid()));

CREATE POLICY "Coaches can delete task media"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-media' AND public.is_coach(auth.uid()));

-- Allow players to delete their own submissions (undo)
CREATE POLICY "Player can delete own submission"
ON public.task_submissions FOR DELETE
USING (auth.uid() = player_id);
