
-- Fix: use subquery for pre-update role value instead of function
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Add missing DELETE policy for task-videos
CREATE POLICY "Users can delete own task video"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
