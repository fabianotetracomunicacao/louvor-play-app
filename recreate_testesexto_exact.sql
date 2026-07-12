-- RECRIAÇÃO EXATA DO testesexto@hotmail.com
-- Usando os dados EXATOS capturados antes da deleção

DO $$
DECLARE
    target_user_id uuid := '541739d0-35a1-4807-9631-5b0f90233440';
    target_email text := 'testesexto@hotmail.com';
    target_password text := 'Teste@123';
    password_hash text;
BEGIN
    -- 0. DESABILITAR TRIGGERS TEMPORARIAMENTE
    RAISE NOTICE '=== DESABILITANDO TRIGGERS ===';
    ALTER TABLE auth.users DISABLE TRIGGER ALL;
    ALTER TABLE auth.identities DISABLE TRIGGER ALL;
    ALTER TABLE public.profiles DISABLE TRIGGER ALL;
    RAISE NOTICE 'Triggers desabilitados';
    
    -- 1. LIMPAR TUDO PRIMEIRO
    RAISE NOTICE '=== LIMPANDO DADOS EXISTENTES ===';
    
    DELETE FROM public.profiles WHERE id = target_user_id;
    RAISE NOTICE 'Profiles deletados';
    
    DELETE FROM auth.identities WHERE user_id = target_user_id;
    RAISE NOTICE 'Identities deletados';
    
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    RAISE NOTICE 'Sessions deletadas';
    
    DELETE FROM auth.refresh_tokens WHERE user_id::uuid = target_user_id;
    RAISE NOTICE 'Tokens deletados';
    
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE 'Users deletado';
    
    RAISE NOTICE '=== LIMPEZA COMPLETA! ===';
    
    -- 1. Gerar o hash da senha usando pgcrypto
    password_hash := extensions.crypt(target_password, extensions.gen_salt('bf'));
    
    RAISE NOTICE 'Hash gerado: %', password_hash;
    
    -- 2. Inserir em auth.users com TODOS os campos exatos
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',  -- instance_id
        target_user_id,                           -- id
        'authenticated',                          -- aud
        'authenticated',                          -- role
        target_email,                             -- email
        password_hash,                            -- encrypted_password
        now(),                                    -- email_confirmed_at
        NULL,                                     -- invited_at
        '',                                       -- confirmation_token
        NULL,                                     -- confirmation_sent_at
        '',                                       -- recovery_token
        NULL,                                     -- recovery_sent_at
        '',                                       -- email_change_token_new
        '',                                       -- email_change
        NULL,                                     -- email_change_sent_at
        NULL,                                     -- last_sign_in_at (NULL como novapessoa2)
        '{"provider":"email","providers":["email"]}'::jsonb,  -- raw_app_meta_data
        jsonb_build_object('sub', target_user_id::text),      -- raw_user_meta_data
        NULL,                                     -- is_super_admin
        now(),                                    -- created_at
        now(),                                    -- updated_at
        NULL,                                     -- phone
        NULL,                                     -- phone_confirmed_at
        '',                                       -- phone_change
        '',                                       -- phone_change_token
        NULL,                                     -- phone_change_sent_at
        '',                                       -- email_change_token_current
        0,                                        -- email_change_confirm_status
        NULL,                                     -- banned_until
        '',                                       -- reauthentication_token
        NULL,                                     -- reauthentication_sent_at
        false,                                    -- is_sso_user
        NULL,                                     -- deleted_at
        false                                     -- is_anonymous
    );
    
    RAISE NOTICE '✅ auth.users inserido!';
    
    -- 3. Inserir em auth.identities com estrutura EXATA
    INSERT INTO auth.identities (
        provider_id,
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        target_user_id::text,                     -- provider_id
        target_user_id,                           -- id
        target_user_id,                           -- user_id
        jsonb_build_object(
            'sub', target_user_id::text,
            'email', target_email
        ),                                        -- identity_data
        'email',                                  -- provider
        now(),                                    -- last_sign_in_at
        now(),                                    -- created_at
        now()                                     -- updated_at
    );
    
    RAISE NOTICE '✅ auth.identities inserido!';
    
    -- 4. Inserir em public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        role,
        created_at,
        name
    ) VALUES (
        target_user_id,                           -- id
        target_email,                             -- email
        'musician',                               -- role
        now(),                                    -- created_at
        'Novo Usuário'                            -- name
    );
    
    RAISE NOTICE '✅ public.profiles inserido!';
    
    -- 6. REABILITAR TRIGGERS
    RAISE NOTICE '=== REABILITANDO TRIGGERS ===';
    ALTER TABLE auth.users ENABLE TRIGGER ALL;
    ALTER TABLE auth.identities ENABLE TRIGGER ALL;
    ALTER TABLE public.profiles ENABLE TRIGGER ALL;
    RAISE NOTICE 'Triggers reabilitados';
    
    -- 7. Verificar criação
    RAISE NOTICE '=== VERIFICAÇÃO ===';
    RAISE NOTICE 'auth.users existe: %', (SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id));
    RAISE NOTICE 'auth.identities existe: %', (SELECT EXISTS(SELECT 1 FROM auth.identities WHERE user_id = target_user_id));
    RAISE NOTICE 'public.profiles existe: %', (SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id));
    
    RAISE NOTICE '=== USUÁRIO RECRIADO COM SUCESSO! ===';
    RAISE NOTICE 'Email: %', target_email;
    RAISE NOTICE 'Senha: %', target_password;
    RAISE NOTICE 'UUID: %', target_user_id;
    
END $$;
