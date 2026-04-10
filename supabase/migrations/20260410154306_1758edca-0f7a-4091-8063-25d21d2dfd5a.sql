
-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'comment',
  title text NOT NULL,
  body text,
  post_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Trigger function to create notification on new comment
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
  _commenter_name text;
  _content_preview text;
BEGIN
  -- Determine post owner
  IF NEW.post_id LIKE 'meal-%' THEN
    SELECT user_id INTO _owner_id
    FROM public.meals
    WHERE id = REPLACE(NEW.post_id, 'meal-', '')::uuid;
  ELSE
    SELECT user_id INTO _owner_id
    FROM public.feed_posts
    WHERE id = NEW.post_id::uuid;
  END IF;

  -- Don't notify yourself
  IF _owner_id IS NULL OR _owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter name
  SELECT name INTO _commenter_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  _content_preview := LEFT(NEW.content, 80);

  INSERT INTO public.notifications (user_id, type, title, body, post_id)
  VALUES (
    _owner_id,
    'comment',
    _commenter_name || ' hat deinen Beitrag kommentiert',
    _content_preview,
    NEW.post_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comment_notify
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_comment_notification();
