
-- Page visits table
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own visits" ON public.page_visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coach can view all visits" ON public.page_visits
  FOR SELECT TO authenticated USING (public.is_coach(auth.uid()));

-- Activity sessions table
CREATE TABLE public.activity_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own sessions" ON public.activity_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update own sessions" ON public.activity_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Players can select own sessions" ON public.activity_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coach can view all sessions" ON public.activity_sessions
  FOR SELECT TO authenticated USING (public.is_coach(auth.uid()));

-- Monthly meal winners table
CREATE TABLE public.monthly_meal_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  player_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  win_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.monthly_meal_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view winners" ON public.monthly_meal_winners
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coach can insert winners" ON public.monthly_meal_winners
  FOR INSERT TO authenticated WITH CHECK (public.is_coach(auth.uid()));
CREATE POLICY "Coach can update winners" ON public.monthly_meal_winners
  FOR UPDATE TO authenticated USING (public.is_coach(auth.uid()));

-- Index for faster queries
CREATE INDEX idx_page_visits_user_date ON public.page_visits (user_id, visited_at);
CREATE INDEX idx_activity_sessions_user_date ON public.activity_sessions (user_id, started_at);
CREATE INDEX idx_monthly_meal_winners_month ON public.monthly_meal_winners (month);
