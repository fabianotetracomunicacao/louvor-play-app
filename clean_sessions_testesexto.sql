-- LIMPEZA COMPLETA DE SESSÕES E TOKENS
-- Este script remove TODAS as sessões e tokens do testesexto
-- para forçar o Supabase Auth a "esquecer" qualquer estado corrupto

DO $$
DECLARE
    target_user_id uuid;
    deleted_sessions int;
    deleted_tokens int;
BEGIN
    -- Pegar o ID do usuário
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'testesexto@hotmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    RAISE NOTICE 'User ID: %', target_user_id;
    
    -- Deletar todas as sessões
    DELETE FROM auth.sessions 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
    RAISE NOTICE 'Sessões deletadas: %', deleted_sessions;
    
    -- Deletar todos os refresh tokens
    DELETE FROM auth.refresh_tokens 
    WHERE user_id::uuid = target_user_id;
    
    GET DIAGNOSTICS deleted_tokens = ROW_COUNT;
    RAISE NOTICE 'Tokens deletados: %', deleted_tokens;
    
    -- Resetar last_sign_in_at para forçar um "primeiro login"
    UPDATE auth.users 
    SET 
        last_sign_in_at = NULL,
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'last_sign_in_at resetado!';
    
    -- Verificar estado final
    RAISE NOTICE '=== ESTADO FINAL ===';
    RAISE NOTICE 'Sessões restantes: %', (SELECT COUNT(*) FROM auth.sessions WHERE user_id = target_user_id);
    RAISE NOTICE 'Tokens restantes: %', (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id::uuid = target_user_id);
    RAISE NOTICE 'last_sign_in_at: %', (SELECT last_sign_in_at FROM auth.users WHERE id = target_user_id);
    
END $$;
