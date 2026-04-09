
-- Add must_change_password to profiles
ALTER TABLE public.profiles ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

-- Create password_reset_requests table
CREATE TABLE public.password_reset_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Players can insert their own requests
CREATE POLICY "Players can insert own reset request"
ON public.password_reset_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

-- Players can view own requests
CREATE POLICY "Players can view own reset requests"
ON public.password_reset_requests
FOR SELECT
TO authenticated
USING (auth.uid() = player_id);

-- Coach can view all requests
CREATE POLICY "Coach can view all reset requests"
ON public.password_reset_requests
FOR SELECT
TO authenticated
USING (is_coach(auth.uid()));

-- Coach can update requests
CREATE POLICY "Coach can update reset requests"
ON public.password_reset_requests
FOR UPDATE
TO authenticated
USING (is_coach(auth.uid()));

-- Coach can delete requests
CREATE POLICY "Coach can delete reset requests"
ON public.password_reset_requests
FOR DELETE
TO authenticated
USING (is_coach(auth.uid()));
