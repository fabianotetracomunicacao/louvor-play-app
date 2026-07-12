-- SIMULAÇÃO COMPLETA: Queries do Login
-- Vamos simular TODAS as queries que o Auth Service faz durante o login
-- para descobrir qual delas está falhando.

DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'testequarto@hotmail.com';
    v_password text := '123456';
    v_hash text;
    v_match boolean;
BEGIN
    RAISE NOTICE '=== INICIANDO SIMULAÇÃO DE LOGIN ===';
    
    -- Query 1: Buscar usuário por email
    BEGIN
        SELECT id, encrypted_password INTO v_user_id, v_hash
        FROM auth.users
        WHERE email = v_email;
        
        RAISE NOTICE '✅ Query 1: Usuário encontrado - ID: %', v_user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 1 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    -- Query 2: Verificar senha
    BEGIN
        SELECT (encrypted_password = public.crypt(v_password, encrypted_password)) INTO v_match
        FROM auth.users
        WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Query 2: Senha verificada - Match: %', v_match;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 2 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    -- Query 3: Buscar identidade
    BEGIN
        PERFORM * FROM auth.identities
        WHERE user_id = v_user_id AND provider = 'email';
        
        RAISE NOTICE '✅ Query 3: Identidade encontrada';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 3 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    -- Query 4: Buscar perfil
    BEGIN
        PERFORM * FROM public.profiles
        WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Query 4: Perfil encontrado';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 4 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    -- Query 5: Atualizar last_sign_in_at
    BEGIN
        UPDATE auth.users
        SET last_sign_in_at = now()
        WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Query 5: last_sign_in_at atualizado';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 5 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    -- Query 6: Criar sessão
    BEGIN
        INSERT INTO auth.sessions (user_id, created_at, updated_at)
        VALUES (v_user_id, now(), now());
        
        RAISE NOTICE '✅ Query 6: Sessão criada';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 6 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    -- Query 7: Criar refresh token
    BEGIN
        INSERT INTO auth.refresh_tokens (user_id, token, created_at, updated_at)
        VALUES (v_user_id, 'test_token_' || gen_random_uuid(), now(), now());
        
        RAISE NOTICE '✅ Query 7: Refresh token criado';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Query 7 FALHOU: %', SQLERRM;
        RETURN;
    END;
    
    RAISE NOTICE '=== SIMULAÇÃO CONCLUÍDA COM SUCESSO ===';
    ROLLBACK; -- Não commitar as mudanças
END $$;
