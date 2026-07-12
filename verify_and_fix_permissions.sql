-- VERIFICAÇÃO E FIX DE PERMISSÕES DO ADMIN DE AUTH
-- Se o login continua falhando, pode ser que o usuário interno 'supabase_auth_admin' esteja bloqueado.

-- 1. Onde está o pgcrypto AGORA?
SELECT extname, extnamespace::regnamespace as schema_atual
FROM pg_extension WHERE extname = 'pgcrypto';

-- 2. Tenta forçar permissões para o admin de autenticação (Crítico!)
GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- 3. Teste final: Tenta executar a função como se fosse usar no login
SELECT extensions.gen_salt('bf') as salt_gerado;

DO $$
BEGIN
    RAISE NOTICE '✅ Permissões forçadas para supabase_auth_admin.';
END $$;
