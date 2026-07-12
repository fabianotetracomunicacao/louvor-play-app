-- REABILITAR TRIGGERS DESABILITADOS

-- 1. Reabilitar fix_metadata_trigger
ALTER TABLE auth.users ENABLE TRIGGER fix_metadata_trigger;

-- 2. Reabilitar on_auth_user_created
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- 3. Verificar se foram habilitados
SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE tgenabled::text
    END as status
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname IN ('fix_metadata_trigger', 'on_auth_user_created')
ORDER BY tgname;
