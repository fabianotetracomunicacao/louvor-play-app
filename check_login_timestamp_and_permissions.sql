-- DIAGNÓSTICO: TIMESTAMP E PERMISSÕES
-- 1. O usuário conseguiu logar na tabela auth (last_sign_in_at)?
SELECT email, last_sign_in_at, created_at 
FROM auth.users 
WHERE email = 'testeterceiro@hotmail.com';

-- 2. O papel 'authenticated' tem permissão de SELECT nas tabelas?
-- (Se RLS estiver desligado, isso é o que manda)
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'authenticated' 
  AND table_name IN ('profiles', 'songs', 'musical_styles');
