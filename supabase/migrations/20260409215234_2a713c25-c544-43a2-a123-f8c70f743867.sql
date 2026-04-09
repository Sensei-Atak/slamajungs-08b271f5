-- Fix task_submissions policy: change from public to authenticated
DROP POLICY "Player can delete own submission" ON task_submissions;
CREATE POLICY "Player can delete own submission" ON task_submissions
  FOR DELETE TO authenticated
  USING (auth.uid() = player_id);

-- Fix storage policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Coaches can upload task media" ON storage.objects;
CREATE POLICY "Coaches can upload task media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-media' AND public.is_coach(auth.uid()));

DROP POLICY IF EXISTS "Coaches can delete task media" ON storage.objects;
CREATE POLICY "Coaches can delete task media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'task-media' AND public.is_coach(auth.uid()));

-- Make buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('meal-photos', 'avatars', 'task-media');

-- Replace public SELECT policies with authenticated-only
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated can view avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Meal photos publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated can view meal photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos');

DROP POLICY IF EXISTS "Task media publicly readable" ON storage.objects;
CREATE POLICY "Authenticated can view task media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'task-media');