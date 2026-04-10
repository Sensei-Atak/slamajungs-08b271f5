
-- Drop the existing combined policy
DROP POLICY IF EXISTS "Coach can insert profiles" ON public.profiles;

-- Coach can insert any profile (including setting any role)
CREATE POLICY "Coach can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (is_coach(auth.uid()));

-- Users can only self-insert with default 'spieler' role
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'spieler');
