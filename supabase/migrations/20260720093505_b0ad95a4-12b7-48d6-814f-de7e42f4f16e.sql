
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Role is ALWAYS 'spieler' on self-signup. raw_user_meta_data is
  -- attacker-controlled and must never influence privileges. Coaches
  -- can promote a player later via the coach-only update policy.
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'spieler'::app_role
  );
  RETURN NEW;
END;
$function$;
