-- FIX: Grant Execution Permissions on RLS Functions
-- Sometimes functions need explicit EXECUTE grants for authenticated users to run them in RLS.

GRANT EXECUTE ON FUNCTION public.fn_is_member_of_playlist(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_is_editor_of_playlist(uuid) TO anon, authenticated, service_role;

-- Also ensure public schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
