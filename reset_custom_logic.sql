-- Remove os triggers que criamos
DROP TRIGGER IF EXISTS fix_metadata_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove as funções que criamos
DROP FUNCTION IF EXISTS public.fix_user_metadata();
DROP FUNCTION IF EXISTS public.handle_new_user();
