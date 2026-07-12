SELECT 
    tgname,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgenabled != 'D';
