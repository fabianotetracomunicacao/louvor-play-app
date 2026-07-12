-- CRIAR: testequinto@hotmail.com via SQL
-- Copiando EXATAMENTE a estrutura dos usuários que funcionam.

BEGIN;

DO $$
DECLARE
    v_user_id uuid := gen_random_uuid();
    v_password_hash text;
BEGIN
    -- Gerar hash da senha '123456'
    v_password_hash := public.crypt('123456', public.gen_salt('bf'));
    
    RAISE NOTICE 'Criando usuário com ID: %', v_user_id;
    
    -- 1. Inserir em auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        is_super_admin,
        phone,
        phone_confirmed_at,
        confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        'testequinto@hotmail.com',
        v_password_hash,
        now(), -- Email já confirmado
        now(), -- Last sign in
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Teste Quinto"}'::jsonb,
        now(),
        now(),
        '', -- confirmation_token vazio
        '', -- email_change vazio
        '', -- email_change_token_new vazio
        '', -- recovery_token vazio
        NULL, -- is_super_admin
        NULL, -- phone
        NULL, -- phone_confirmed_at
        now(), -- confirmed_at
        NULL, -- confirmation_sent_at NULL (como os que funcionam)
        NULL, -- recovery_sent_at
        NULL, -- email_change_sent_at
        0, -- email_change_confirm_status
        NULL, -- banned_until
        '', -- reauthentication_token
        NULL, -- reauthentication_sent_at
        false, -- is_sso_user
        NULL -- deleted_at
    );
    
    RAISE NOTICE 'Usuário criado em auth.users';
    
    -- 2. Inserir em auth.identities
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
        'testequinto@hotmail.com', -- provider_id = email
        v_user_id,
        v_user_id,
        jsonb_build_object(
            'sub', v_user_id::text,
            'email', 'testequinto@hotmail.com',
            'email_verified', true
        ),
        'email',
        now(),
        now(),
        now()
    );
    
    RAISE NOTICE 'Identidade criada em auth.identities';
    RAISE NOTICE '=== SUCESSO! Usuário testequinto criado ===';
    RAISE NOTICE 'Agora o trigger deve criar o perfil automaticamente.';
    
END $$;

COMMIT;

-- Verificar criação
SELECT 'Verificação:' as status;
SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    i.provider_id,
    p.name as nome_perfil,
    p.role as role_perfil
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'testequinto@hotmail.com';
