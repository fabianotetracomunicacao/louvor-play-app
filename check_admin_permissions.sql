-- PERMISSÕES E DADOS DO SISTEMA
-- Vamos ver se o "supabase_auth_admin" tem permissão de escrever.
-- E checar se o ID de instância do usuário está "normal".

SELECT 
    grantee, 
    table_schema, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'supabase_auth_admin'
AND table_schema = 'auth'
AND table_name IN ('users', 'sessions', 'refresh_tokens');

-- CHECAGEM DE INSTÂNCIA
SELECT email, instance_id, aud, role 
FROM auth.users 
WHERE email = 'testeterceiro@hotmail.com';
