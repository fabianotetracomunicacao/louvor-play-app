-- PROVA DE FOGO: VESTINDO A ROUPA DO BORÔ
-- Vamos se passar pelo supabase_auth_admin e ver onde ele trava.

DO $$
DECLARE
    v_count int;
    v_salt text;
    v_uuid uuid;
BEGIN
    RAISE NOTICE '🤖 Iniciando teste como supabase_auth_admin...';
    
    -- 1. Troca de identidade
    SET LOCAL ROLE supabase_auth_admin;

    -- 2. Tenta ler usuários
    BEGIN
        SELECT count(*) INTO v_count FROM auth.users;
        RAISE NOTICE '✅ LEITURA OK (Encontrou % usuários)', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ LEITURA FALHOU: %', SQLERRM;
    END;

    -- 3. Tenta usar o Wrapper de Criptografia
    BEGIN
        SELECT public.gen_salt('bf') INTO v_salt;
        RAISE NOTICE '✅ WRAPPER CRYPT OK (Salt: %)', substring(v_salt from 1 for 10) || '...';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ WRAPPER CRYPT FALHOU: %', SQLERRM;
    END;

    -- 4. Tenta usar o Wrapper de UUID
    BEGIN
        SELECT public.uuid_generate_v4() INTO v_uuid;
        RAISE NOTICE '✅ WRAPPER UUID OK (ID: %)', v_uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ WRAPPER UUID FALHOU: %', SQLERRM;
    END;

    -- 5. Tenta escrever (Update simples)
    BEGIN
        UPDATE auth.users SET updated_at = now() WHERE email = 'testeterceiro@hotmail.com';
        RAISE NOTICE '✅ ESCRITA (UPDATE) OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ESCRITA (UPDATE) FALHOU: %', SQLERRM;
    END;

    -- Volta ao normal
    RESET ROLE;
END $$;
