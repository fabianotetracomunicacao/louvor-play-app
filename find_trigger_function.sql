SELECT 
    t.tgname, 
    p.proname as function_name,
    n.nspname as function_schema
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE t.tgname = 'fix_metadata_trigger';
