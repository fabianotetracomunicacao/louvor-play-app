SELECT 
    t.tgname, 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'profiles' AND n.nspname = 'public';
