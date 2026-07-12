-- Deletar e recriar testesetimo EXATAMENTE como testesexto
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    new_identity_id uuid := gen_random_uuid();
    password_hash text;
BEGIN
    -- 1. Deletar tudo do testesetimo
    DELETE FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com');
    DELETE FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com');
    DELETE FROM auth.users WHERE email = 'testesetimo@hotmail.com';
    
    RAISE NOTICE 'testesetimo deletado!';
    
    -- 2. Gerar hash da senha 123456
    password_hash := extensions.crypt('123456', extensions.gen_salt('bf'));
    
    -- 3. Criar user EXATAMENTE como testesexto
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
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'testesetimo@hotmail.com',
        password_hash,
        now(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('sub', new_user_id::text),
        NULL,
        now(),
        now(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
    );
    
    RAISE NOTICE 'User criado com ID: %', new_user_id;
    
    -- 4. Criar identity EXATAMENTE como testesexto
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        provider,
        identity_data,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_identity_id,
        new_user_id,
        new_user_id::text,
        'email',
        jsonb_build_object(
            'sub', new_user_id::text,
            'email', 'testesetimo@hotmail.com'
        ),
        NULL,
        now(),
        now()
    );
    
    RAISE NOTICE 'Identity criada com ID: %', new_identity_id;
    
    -- 5. Criar profile
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (new_user_id, 'testesetimo@hotmail.com', 'musician', now())
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        role = EXCLUDED.role;
    
    RAISE NOTICE 'Profile criado!';
    RAISE NOTICE '=================================';
    RAISE NOTICE 'TUDO PRONTO! Tente login agora!';
    RAISE NOTICE 'Email: testesetimo@hotmail.com';
    RAISE NOTICE 'Senha: 123456';
    
END $$;
