-- 1. Ver RLS da tabela profiles
SELECT 
    'RLS STATUS' as check_type,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'profiles';
