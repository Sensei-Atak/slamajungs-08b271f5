
CREATE TABLE public.meal_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (meal_id, user_id)
);

ALTER TABLE public.meal_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view ratings"
  ON public.meal_ratings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert own rating"
  ON public.meal_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can update own rating"
  ON public.meal_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_meal_ratings_meal_id ON public.meal_ratings(meal_id);
CREATE INDEX idx_meal_ratings_created_at ON public.meal_ratings(created_at);
