-- Ver triggers em auth.users
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'RI_%'  -- Ignora triggers internos
ORDER BY tgname;
