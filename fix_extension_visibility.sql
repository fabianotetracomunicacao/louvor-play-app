-- FIX EXTENSION VISIBILITY (Mover pgcrypto para Public)
-- Já que não podemos configurar o usuário do sistema (é proibido),
-- vamos mover a ferramenta de senha (pgcrypto) para a pasta 'public',
-- onde TODO MUNDO consegue ver.

DO $$
BEGIN
    -- 1. Verifica se pgcrypto existe
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        RAISE NOTICE 'Movendo pgcrypto para o schema PUBLIC...';
        
        -- Tenta mover para public. Se já estiver lá, não tem problema.
        ALTER EXTENSION pgcrypto SET SCHEMA public;
        
        RAISE NOTICE '✅ Sucesso! pgcrypto agora está em Public.';
    ELSE
        -- 2. Se não existir, cria direto no Public
        CREATE EXTENSION pgcrypto SCHEMA public;
        RAISE NOTICE '✅ Sucesso! pgcrypto criada em Public.';
    END IF;

    -- 3. Recarregar Cache
    NOTIFY pgrst, 'reload';
    
    RAISE NOTICE 'Tente fazer login agora.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ AVISO: Não foi possível mover a extensão. Motivo: %', SQLERRM;
    -- Se falhar, pode ser que já esteja em public ou falte permissão de superuser real.
    -- Mas vale a tentativa.
END $$;
