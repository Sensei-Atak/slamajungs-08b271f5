-- Fix 1: Add WITH CHECK to meal_ratings UPDATE policy
DROP POLICY IF EXISTS "Authenticated can update own rating" ON public.meal_ratings;
CREATE POLICY "Authenticated can update own rating"
  ON public.meal_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: Harden profile update policy with direct subquery to prevent any race condition
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );
