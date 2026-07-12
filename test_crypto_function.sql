-- TESTE DE CRIPTOGRAFIA (PGCRYPTO)
-- Verifica se o banco consegue calcular hashes de senha.

DO $$
DECLARE
    v_hash text;
BEGIN
    RAISE NOTICE '🔍 Testando funções de criptografia...';

    -- 1. Tenta usar o schema padrão 'extensions'
    BEGIN
        v_hash := extensions.crypt('teste123', extensions.gen_salt('bf'));
        RAISE NOTICE '✅ SUCESSO via schema EXTENSIONS.';
        RAISE NOTICE '   Hash gerado: %', substring(v_hash from 1 for 20) || '...';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FALHA via schema EXTENSIONS: %', SQLERRM;
        
        -- 2. Tenta via schema 'public' (fallback comum)
        BEGIN
            v_hash := public.crypt('teste123', public.gen_salt('bf'));
            RAISE NOTICE '✅ SUCESSO via schema PUBLIC.';
            RAISE NOTICE '   Hash gerado: %', substring(v_hash from 1 for 20) || '...';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ FALHA TOTAL: Não conseguiu usar crypt() nem em public nem em extensions.';
            RAISE NOTICE '   Erro Public: %', SQLERRM;
        END;
    END;
END $$;
