-- TESTE FINAL DE ESCRITA: REFRESH TOKEN
-- O login cria Sessão -> Depois cria Refresh Token.
-- Se falhar aqui, o 500 é culpa dessa tabela.

DO $$
DECLARE
    v_user_id uuid;
    v_session_id uuid;
    v_token_id bigint;
BEGIN
    -- 1. Pega usuário
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'testeterceiro@hotmail.com';

    -- 2. Cria Sessão (De novo, parte do fluxo)
    INSERT INTO auth.sessions (id, user_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, now(), now())
    RETURNING id INTO v_session_id;

    RAISE NOTICE '✅ Sessão criada: %', v_session_id;

    -- 3. Tenta criar Refresh Token (O Grande Final)
    INSERT INTO auth.refresh_tokens (
        instance_id,
        id,
        token,
        user_id,
        revoked,
        created_at,
        updated_at,
        session_id
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', -- Instance padrão
        NEXTVAL('auth.refresh_tokens_id_seq'), -- ID auto numerado
        'token_teste_' || gen_random_uuid(),     -- Token falso
        v_user_id,
        false,
        now(),
        now(),
        v_session_id
    )
    RETURNING id INTO v_token_id;

    RAISE NOTICE '✅✅ REFRESH TOKEN CRIADO: %', v_token_id;
    RAISE NOTICE 'CONCLUSÃO: O banco aceita TUDO. Se o login falha, é mistério de permissão do role interno.';
    
    -- Rollback pra não sujar
    RAISE EXCEPTION 'Rollback de Teste - Sucesso!';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Rollback de Teste - Sucesso!' THEN
        RAISE NOTICE '🎉 TESTE PASSOU COMPLETAMENTE!';
    ELSE
        RAISE NOTICE '❌ FALHA AO CRIAR REFRESH TOKEN: %', SQLERRM;
    END IF;
END $$;
