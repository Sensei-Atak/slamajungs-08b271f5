
-- Fix task_submissions delete policy: public → authenticated
DROP POLICY IF EXISTS "Player can delete own submission" ON public.task_submissions;
CREATE POLICY "Player can delete own submission"
  ON public.task_submissions FOR DELETE TO authenticated
  USING (auth.uid() = player_id);

-- Fix storage policies: public → authenticated
-- Avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Task media
DROP POLICY IF EXISTS "Coaches can upload task media" ON storage.objects;
CREATE POLICY "Coaches can upload task media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-media' AND is_coach(auth.uid()));

DROP POLICY IF EXISTS "Coaches can delete task media" ON storage.objects;
CREATE POLICY "Coaches can delete task media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-media' AND is_coach(auth.uid()));

-- Add missing UPDATE policy for task-videos bucket
CREATE POLICY "Users can update own task video"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'task-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
