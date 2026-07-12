-- Testar login DIRETAMENTE no banco (simular o que o Supabase Auth faz)
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'teste11@hotmail.com';
    v_password text := '123456';
    v_encrypted_password text;
    v_password_match boolean;
BEGIN
    -- 1. Buscar usuário
    SELECT id, encrypted_password 
    INTO v_user_id, v_encrypted_password
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'ERRO: Usuário não encontrado';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuário encontrado: %', v_user_id;
    
    -- 2. Verificar senha
    v_password_match := (v_encrypted_password = extensions.crypt(v_password, v_encrypted_password));
    
    IF NOT v_password_match THEN
        RAISE NOTICE 'ERRO: Senha incorreta';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Senha correta!';
    
    -- 3. Verificar se está confirmado
    IF (SELECT email_confirmed_at FROM auth.users WHERE id = v_user_id) IS NULL THEN
        RAISE NOTICE 'ERRO: Email não confirmado';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Email confirmado!';
    
    -- 4. Verificar identity
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
        RAISE NOTICE 'ERRO: Identity não existe';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Identity existe!';
    
    -- 5. Verificar profile
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
        RAISE NOTICE 'ERRO: Profile não existe';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Profile existe!';
    RAISE NOTICE '✅ LOGIN DEVERIA FUNCIONAR!';
    
END $$;
