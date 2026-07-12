-- Ver RLS e todas as policies da tabela profiles
SELECT 
    'RLS ENABLED' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Ver todas as policies em detalhes
SELECT 
    'POLICY DETAILS' as info,
    policyname,
    cmd as command,
    roles,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
