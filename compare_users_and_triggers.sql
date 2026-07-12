SELECT email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email LIKE 'testequatro%' OR email LIKE 'fabiano%';

SELECT 
    tgname, 
    tgrelid::regclass as table_name,
    tgenabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;
