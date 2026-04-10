
-- App settings table
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can select settings" ON public.app_settings FOR SELECT TO authenticated USING (is_coach(auth.uid()));
CREATE POLICY "Coach can insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (is_coach(auth.uid()));
CREATE POLICY "Coach can update settings" ON public.app_settings FOR UPDATE TO authenticated USING (is_coach(auth.uid()));
CREATE POLICY "Coach can delete settings" ON public.app_settings FOR DELETE TO authenticated USING (is_coach(auth.uid()));

-- Insert default invite code
INSERT INTO public.app_settings (key, value) VALUES ('team_invite_code', 'SlamaJama2026');

-- Security definer function to verify invite code without exposing it
CREATE OR REPLACE FUNCTION public.verify_invite_code(code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_settings
    WHERE key = 'team_invite_code' AND value = code
  )
$$;
