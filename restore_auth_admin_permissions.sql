-- RESGATE DE PERMISSÕES DO ADMIN
-- O login falha porque o "supabase_auth_admin" provavelmenteficou sem permissão.
-- Vamos devolver o poder a ele.

BEGIN;

-- 1. Garante uso do schema
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;

-- 2. Garante poder total nas tabelas (Users, Sessions, etc)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;

-- 3. Garante poder total nas sequências (IDs automáticos)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;

-- 4. Garante poder de executar funções
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;

COMMIT;

SELECT 'Permissões restauradas com sucesso para supabase_auth_admin' as status;
