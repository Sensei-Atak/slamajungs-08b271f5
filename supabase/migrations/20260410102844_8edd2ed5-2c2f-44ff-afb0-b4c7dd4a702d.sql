
-- Coach can update task submissions
CREATE POLICY "Coach can update submissions"
  ON public.task_submissions FOR UPDATE TO authenticated
  USING (is_coach(auth.uid()));

-- Coach can delete task videos
CREATE POLICY "Coach can delete task videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-videos' AND is_coach(auth.uid()));
