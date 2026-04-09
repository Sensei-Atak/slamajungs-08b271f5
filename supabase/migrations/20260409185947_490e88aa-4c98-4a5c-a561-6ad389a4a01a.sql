
-- Role enum
CREATE TYPE public.app_role AS ENUM ('coach', 'spieler');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role app_role NOT NULL DEFAULT 'spieler',
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION public.is_coach(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'coach') $$;

-- Profiles RLS
CREATE POLICY "All authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Coach can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_coach(auth.uid()) OR auth.uid() = id);
CREATE POLICY "Coach can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_coach(auth.uid()));
CREATE POLICY "Coach can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_coach(auth.uid()));

-- Meals table
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view meals" ON public.meals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own meals" ON public.meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete own meals" ON public.meals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coach can delete any meal" ON public.meals FOR DELETE TO authenticated USING (public.is_coach(auth.uid()));

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coach can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.is_coach(auth.uid()));
CREATE POLICY "Coach can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.is_coach(auth.uid()));
CREATE POLICY "Coach can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.is_coach(auth.uid()));

-- Task submissions
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, player_id)
);

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player can view own submissions" ON public.task_submissions FOR SELECT TO authenticated USING (auth.uid() = player_id);
CREATE POLICY "Coach can view all submissions" ON public.task_submissions FOR SELECT TO authenticated USING (public.is_coach(auth.uid()));
CREATE POLICY "Player can insert own submission" ON public.task_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

-- Games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  opponent TEXT NOT NULL,
  score_home INTEGER NOT NULL DEFAULT 0,
  score_away INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view games" ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coach can insert games" ON public.games FOR INSERT TO authenticated WITH CHECK (public.is_coach(auth.uid()));
CREATE POLICY "Coach can update games" ON public.games FOR UPDATE TO authenticated USING (public.is_coach(auth.uid()));
CREATE POLICY "Coach can delete games" ON public.games FOR DELETE TO authenticated USING (public.is_coach(auth.uid()));

-- Player stats
CREATE TABLE public.player_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pts_override INTEGER,
  fw_made INTEGER NOT NULL DEFAULT 0,
  fw_attempted INTEGER NOT NULL DEFAULT 0,
  twop_made INTEGER NOT NULL DEFAULT 0,
  twop_attempted INTEGER NOT NULL DEFAULT 0,
  threep_made INTEGER NOT NULL DEFAULT 0,
  threep_attempted INTEGER NOT NULL DEFAULT 0,
  reb INTEGER NOT NULL DEFAULT 0,
  ast INTEGER NOT NULL DEFAULT 0,
  blk INTEGER NOT NULL DEFAULT 0,
  stl INTEGER NOT NULL DEFAULT 0,
  to_count INTEGER NOT NULL DEFAULT 0,
  fouls INTEGER NOT NULL DEFAULT 0,
  UNIQUE(game_id, player_id)
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view stats" ON public.player_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coach can insert stats" ON public.player_stats FOR INSERT TO authenticated WITH CHECK (public.is_coach(auth.uid()));
CREATE POLICY "Coach can update stats" ON public.player_stats FOR UPDATE TO authenticated USING (public.is_coach(auth.uid()));
CREATE POLICY "Coach can delete stats" ON public.player_stats FOR DELETE TO authenticated USING (public.is_coach(auth.uid()));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('task-videos', 'task-videos', false);

-- Storage policies
CREATE POLICY "Meal photos publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');
CREATE POLICY "Upload own meal photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Delete own meal photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Coach delete any meal photo" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meal-photos' AND public.is_coach(auth.uid()));
CREATE POLICY "View own task videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Coach view all task videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-videos' AND public.is_coach(auth.uid()));
CREATE POLICY "Upload own task videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'spieler')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
