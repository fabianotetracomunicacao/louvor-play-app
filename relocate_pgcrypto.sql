-- MUDANÇA DE ENDEREÇO DA EXTESÃO (FIX FINAL)
-- O Supabase procura em 'extensions', mas está em 'public'. Vamos mover.

-- 1. Cria o schema 'extensions' se não existir (essencial)
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Permite que todo mundo veja esse schema (para o login funcionar)
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. Move a extensão de casa (Public -> Extensions)
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

-- 4. Re-garante permissões nas funções (só por precaução)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
    RAISE NOTICE '✅ Pgcrypto movido para o schema EXTENSIONS com sucesso!';
END $$;
