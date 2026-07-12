-- CRIAÇÃO DE USUÁRIO DE TESTE (NOVO PADRÃO)
-- Vamos criar um usuário do ZERO para ver se o problema é o "testeterceiro" ou o sistema todo.

DO $$
DECLARE
    v_user_id uuid := gen_random_uuid();
    v_email text := 'login_test@teste.com';
    v_password text := '123456';
    v_encrypted_password text;
BEGIN
    -- 1. Gera Hash (usando a função publica que criamos)
    v_encrypted_password := public.crypt(v_password, public.gen_salt('bf'));

    -- 2. Insere User
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_password,
        now(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- 3. Insere Identity (Crucial para o Supabase não se perder)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true),
        'email',
        v_user_id, -- Para provider email, o ID é o próprio UUID do user muitas vezes, ou o email. Vamos usar o UUID pra garantir.
        NULL,
        now(),
        now()
    );

    RAISE NOTICE '✅ Usuário criado: % | Senha: %', v_email, v_password;
END $$;
