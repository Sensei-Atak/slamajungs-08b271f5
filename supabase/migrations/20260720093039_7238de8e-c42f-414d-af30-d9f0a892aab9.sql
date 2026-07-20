
-- Lock down SECURITY DEFINER functions: revoke public/anon/authenticated execute,
-- then grant only where the client actually needs it.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_comment_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.must_change_password(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_coach(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_invite_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM PUBLIC;

-- Client-facing RPCs used during login/signup:
GRANT EXECUTE ON FUNCTION public.verify_invite_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;
