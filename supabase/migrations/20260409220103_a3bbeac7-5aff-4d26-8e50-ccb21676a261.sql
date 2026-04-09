-- Security definer function to check must_change_password without recursion
CREATE OR REPLACE FUNCTION public.must_change_password(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT must_change_password FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Block INSERT on meals if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert own meals" ON meals;
CREATE POLICY "Authenticated can insert own meals" ON meals
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on feed_posts if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert own posts" ON feed_posts;
CREATE POLICY "Authenticated can insert own posts" ON feed_posts
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on task_submissions if must_change_password is true
DROP POLICY IF EXISTS "Player can insert own submission" ON task_submissions;
CREATE POLICY "Player can insert own submission" ON task_submissions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = player_id
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on post_comments if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert own comment" ON post_comments;
CREATE POLICY "Authenticated can insert own comment" ON post_comments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on post_likes if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert own like" ON post_likes;
CREATE POLICY "Authenticated can insert own like" ON post_likes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on hangout_reactions if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert own reaction" ON hangout_reactions;
CREATE POLICY "Authenticated can insert own reaction" ON hangout_reactions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on hangout_details if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert hangout details" ON hangout_details;
CREATE POLICY "Authenticated can insert hangout details" ON hangout_details
FOR INSERT TO authenticated
WITH CHECK (
  (EXISTS (SELECT 1 FROM feed_posts WHERE feed_posts.id = hangout_details.post_id AND feed_posts.user_id = auth.uid()))
  AND NOT public.must_change_password(auth.uid())
);

-- Block INSERT on meal_ratings if must_change_password is true
DROP POLICY IF EXISTS "Authenticated can insert own rating" ON meal_ratings;
CREATE POLICY "Authenticated can insert own rating" ON meal_ratings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.must_change_password(auth.uid())
);