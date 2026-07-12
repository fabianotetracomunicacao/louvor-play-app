-- Verificar RLS e Policies da tabela profiles
SELECT 
    'RLS STATUS' as info,
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'profiles';

-- Listar todas as policies
SELECT 
    'POLICIES' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar trigger que cria profile
SELECT 
    'TRIGGERS' as info,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
ORDER BY trigger_name;
