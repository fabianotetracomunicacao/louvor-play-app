-- SIMULAÇÃO COMPLETA DE LOGIN (DB SIDE)
-- Vamos fazer manualmente o que o Supabase faz para achar onde ele tropeça.

DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'testeterceiro@hotmail.com';
    v_password text := '123456';
    v_hash text;
    v_session_id uuid;
BEGIN
    -- 1. BUSCAR USUÁRIO
    SELECT id, encrypted_password INTO v_user_id, v_hash
    FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado!';
    END IF;
    RAISE NOTICE '1. Usuário encontrado: %', v_user_id;

    -- 2. VERIFICAR SENHA
    IF v_hash = extensions.crypt(v_password, v_hash) THEN
        RAISE NOTICE '2. Senha validada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Senha incorreta (Hash não bate)!';
    END IF;

    -- 3. TENTAR CRIAR SESSÃO (Aqui que deve estar o erro 500)
    -- Vamos tentar inserir na tabela auth.sessions
    BEGIN
        INSERT INTO auth.sessions (id, user_id, created_at, updated_at)
        VALUES (gen_random_uuid(), v_user_id, now(), now())
        RETURNING id INTO v_session_id;
        
        RAISE NOTICE '3. Sessão criada com sucesso! ID: %', v_session_id;
        
        -- Rollback manual para não sujar o banco
        RAISE EXCEPTION 'Teste concluído com sucesso (Rollback intencional)';
    EXCEPTION 
        WHEN OTHERS THEN
            IF SQLERRM = 'Teste concluído com sucesso (Rollback intencional)' THEN
                RAISE NOTICE '✅ TESTE PASSOU EM TODAS AS ETAPAS!';
            ELSE
                RAISE NOTICE '❌ ERRO AO CRIAR SESSÃO: %', SQLERRM;
                RAISE NOTICE '   Código de erro: %', SQLSTATE;
            END IF;
    END;
END $$;
