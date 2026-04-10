
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text;

-- Create unique index (partial, only non-null values)
CREATE UNIQUE INDEX idx_profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;

-- Function to resolve username to email for login
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE p.username = lower(p_username)
  LIMIT 1;
$$;
