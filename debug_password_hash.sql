-- DEBUG DE HASH E PERMISSÃO DO ADMIN
-- Vamos ver como está a senha salva e se o 'supabase_auth_admin' consegue checar.

DO $$
DECLARE
    v_user_id uuid;
    v_hash text;
    v_check text;
    v_works boolean;
BEGIN
    SELECT id, encrypted_password INTO v_user_id, v_hash
    FROM auth.users
    WHERE email = 'testeterceiro@hotmail.com';
    
    RAISE NOTICE '👤 User ID: %', v_user_id;
    RAISE NOTICE '🔑 Hash Atual: %', v_hash;

    -- Tenta simular a verificação de senha (como o Auth faz)
    BEGIN
        -- Checa se o hash bate com '123456'
        v_check := extensions.crypt('123456', v_hash);
        
        IF v_check = v_hash THEN
            RAISE NOTICE '✅ Verificação de senha BATEU via SQL (postgres role).';
        ELSE
            RAISE NOTICE '❌ Senha INVÁLIDA via SQL. O hash não corresponde a "123456".';
        END IF;
    EXCEPTION WHEN OTHERS THEN
         RAISE NOTICE '❌ Erro ao executar extensions.crypt: %', SQLERRM;
    END;

    -- AGORA O TESTE DE FOGO: Mudar para o role do Auth e tentar
    -- (Isso simula o erro real)
    BEGIN
        SET LOCAL ROLE supabase_auth_admin;
        v_check := extensions.crypt('123456', v_hash);
        IF v_check = v_hash THEN
            RAISE NOTICE '✅ supabase_auth_admin CONSEGUE validar a senha!';
        ELSE
            RAISE NOTICE '❌ supabase_auth_admin validou mas deu senha errada.';
        END IF;
        RESET ROLE;
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        RAISE NOTICE '🚨 supabase_auth_admin FALHOU ao usar crypt(): %', SQLERRM;
        RAISE NOTICE '   Isso confirma erro de PERMISSÃO para o robô do Auth.';
    END;
END $$;
