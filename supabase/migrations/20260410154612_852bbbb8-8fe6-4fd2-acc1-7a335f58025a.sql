
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
  EXCEPTION WHEN OTHERS THEN
    -- Invalid ID format, skip notification
    RETURN NEW;
  END;

  -- Don't notify yourself
  IF _owner_id IS NULL OR _owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

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
