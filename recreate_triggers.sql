-- RECRIAR TRIGGERS (isso vai habilitá-los automaticamente)

-- 1. Dropar e recriar fix_metadata_trigger
DROP TRIGGER IF EXISTS fix_metadata_trigger ON auth.users;
CREATE TRIGGER fix_metadata_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION fix_user_metadata();

-- 2. Dropar e recriar on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar se foram habilitados
SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ ENABLED'
        WHEN tgenabled = 'D' THEN '❌ DISABLED'
        ELSE tgenabled::text
    END as status
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname IN ('fix_metadata_trigger', 'on_auth_user_created')
ORDER BY tgname;
