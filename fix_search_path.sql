-- FIX SEARCH PATH (Correção de Caminho de Busca)
-- Erro 500 no Login geralmente acontece quando o sistema não encontra a extensão 'pgcrypto'.
-- Isso ocorre se ela estiver no schema 'extensions' mas o usuário do sistema não estiver olhando lá.

DO $$
BEGIN
    -- 1. Configurar o 'service_role' (backend) para enxergar 'extensions'
    ALTER ROLE service_role SET search_path = public, auth, extensions;
    
    -- 2. Configurar o 'supabase_auth_admin' (quem faz o login) para enxergar tudo
    ALTER ROLE supabase_auth_admin SET search_path = public, auth, extensions;

    -- 3. Configurar o 'postgres' (admin) também, por garantia
    ALTER ROLE postgres SET search_path = public, auth, extensions;
    
    -- 4. Tenta mover a extensão pgcrypto para 'extensions' (se já não estiver)
    -- Ou garantir que ela existe no schema certo.
    CREATE SCHEMA IF NOT EXISTS extensions;
    CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

    RAISE NOTICE '✅ Caminhos de busca (search_path) corrigidos com sucesso!';
    RAISE NOTICE 'Agora o sistema deve encontrar as funções de criptografia.';
END $$;
