
-- Create post_type enum
CREATE TYPE public.post_type AS ENUM ('meal', 'hangout', 'photo');

-- Create unified feed_posts table
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type public.post_type NOT NULL,
  image_url TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hangout details for hangout posts
CREATE TABLE public.hangout_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL
);

-- Hangout reactions (thumbs up/down)
CREATE TABLE public.hangout_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post likes (for photo posts)
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post comments (for all post types)
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- feed_posts policies
CREATE POLICY "All authenticated can view posts" ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own posts" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete own posts" ON public.feed_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coach can delete any post" ON public.feed_posts FOR DELETE TO authenticated USING (is_coach(auth.uid()));

-- hangout_details policies
CREATE POLICY "All authenticated can view hangout details" ON public.hangout_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert hangout details" ON public.hangout_details FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.feed_posts WHERE id = post_id AND user_id = auth.uid())
);

-- hangout_reactions policies
CREATE POLICY "All authenticated can view reactions" ON public.hangout_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own reaction" ON public.hangout_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can update own reaction" ON public.hangout_reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can delete own reaction" ON public.hangout_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_likes policies
CREATE POLICY "All authenticated can view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own like" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can delete own like" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments policies
CREATE POLICY "All authenticated can view comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own comment" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can delete own comment" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coach can delete any comment" ON public.post_comments FOR DELETE TO authenticated USING (is_coach(auth.uid()));
