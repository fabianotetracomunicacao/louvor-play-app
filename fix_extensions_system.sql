-- REPARO DE EXTENSÕES E PERMISSÕES DO SISTEMA
-- Versão corrigida (sem erro de sintaxe no RAISE)

-- 1. Garante que pgcrypto existe
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Garante que o usuário do banco vê as extensões
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. Garante execução das funções de criptografia
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
    RAISE NOTICE '✅ Extensões e permissões aplicadas.';
END $$;
