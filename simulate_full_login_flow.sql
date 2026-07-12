-- SIMULAÇÃO COMPLETA DE LOGIN (Sessão + Token)
-- O Update de usuário funcionou. Agora vamos ver se o banco deixa criar a SESSÃO.
-- Teste rodando como 'service_role' (Sistema).

DO $$
DECLARE
    target_email TEXT := 'teste_supremo@tetracom.com';
    u_id UUID;
    s_id UUID;
BEGIN
    -- 1. Pega ID
    SELECT id INTO u_id FROM auth.users WHERE email = target_email;

    IF u_id IS NULL THEN
        RAISE EXCEPTION 'Usuário teste não encontrado.';
    END IF;

    -- 2. Troca de Roupa (Vira o Sistema)
    SET LOCAL ROLE service_role;
    RAISE NOTICE 'Role atual: service_role.';

    -- 3. Tenta CRIAR UMA SESSÃO (Isso acontece no login)
    RAISE NOTICE 'Tentando criar sessão em auth.sessions...';
    
    INSERT INTO auth.sessions (id, user_id, created_at, updated_at)
    VALUES (gen_random_uuid(), u_id, now(), now())
    RETURNING id INTO s_id;
    
    RAISE NOTICE '✅ Sessão criada com sucesso (ID: %)', s_id;

    -- 4. Tenta CRIAR UM REFRESH TOKEN
    RAISE NOTICE 'Tentando criar token em auth.refresh_tokens...';
    
    INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, session_id)
    VALUES (
        '00000000-0000-0000-0000-000000000000', 
        gen_random_uuid(), 
        'test-token-' || gen_random_uuid(), 
        u_id, 
        false, 
        now(), 
        now(), 
        s_id
    );
    
    RAISE NOTICE '✅ Refresh Token criado com sucesso.';
    RAISE NOTICE 'CONCLUSÃO: O banco permite login completo.';

    RESET ROLE;
EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RAISE NOTICE '❌ FALHA NO PROCESSO: % (SQLState: %)', SQLERRM, SQLSTATE;
END $$;
