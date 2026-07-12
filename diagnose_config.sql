-- DIAGNÓSTICO COMPLETO DE CONFIGURAÇÕES

-- 1. Ver RLS da tabela profiles
SELECT 
    'RLS STATUS' as check_type,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'profiles';

-- 2. Ver TODAS as policies de profiles
SELECT 
    'POLICIES' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 3. Ver triggers em auth.users
SELECT 
    'TRIGGERS ON auth.users' as check_type,
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'RI_%'  -- Ignora triggers internos
ORDER BY tgname;

-- 4. Ver permissões do schema public
SELECT 
    'SCHEMA PERMISSIONS' as check_type,
    'public' as schema_name,
    (aclexplode(nspacl)).grantee::regrole::text as grantee,
    (aclexplode(nspacl)).privilege_type as privilege
FROM pg_namespace
WHERE nspname = 'public';

-- 5. Ver permissões na tabela profiles
SELECT 
    'TABLE PERMISSIONS' as check_type,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY grantee, privilege_type;
