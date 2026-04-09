
-- Add scheduling fields to games
ALTER TABLE public.games
ADD COLUMN game_time TIME WITHOUT TIME ZONE,
ADD COLUMN location TEXT,
ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled';

-- Create game rosters table
CREATE TABLE public.game_rosters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

ALTER TABLE public.game_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view rosters"
ON public.game_rosters FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Coach can insert rosters"
ON public.game_rosters FOR INSERT TO authenticated
WITH CHECK (is_coach(auth.uid()));

CREATE POLICY "Coach can delete rosters"
ON public.game_rosters FOR DELETE TO authenticated
USING (is_coach(auth.uid()));

CREATE POLICY "Coach can update rosters"
ON public.game_rosters FOR UPDATE TO authenticated
USING (is_coach(auth.uid()));
