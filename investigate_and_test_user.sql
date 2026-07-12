-- INVESTIGAÇÃO DE TRIGGER E CRIAÇÃO DE USUÁRIO DE TESTE

-- 1. Ver o que a função do trigger faz (para saber se ela está quebrando)
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Criar um usuário de TESTE "Limpo" (Sem usar o RPC, inserindo na mão)
-- Vamos ver se esse usuário consegue logar.
DO $$
DECLARE
    test_id UUID := 'aaaaa000-0000-0000-0000-000000000000';
    test_email TEXT := 'teste_supremo@tetracom.com';
BEGIN
    -- Limpar se já existir
    DELETE FROM auth.identities WHERE user_id = test_id;
    DELETE FROM public.profiles WHERE id = test_id;
    DELETE FROM auth.users WHERE id = test_id;

    -- Inserir User
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, 
        aud, role, instance_id, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        test_id, test_email, crypt('123456', gen_salt('bf')), now(),
        'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000',
        '{"provider":"email","providers":["email"]}', '{}',
        now(), now()
    );

    -- Inserir Identidade (Obrigatório)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, 
        last_sign_in_at, created_at, updated_at
    ) VALUES (
        test_id, test_id, 
        jsonb_build_object('sub', test_id, 'email', test_email, 'email_verified', true),
        'email', test_id::text,
        now(), now(), now()
    );

    -- Inserir Perfil (Se o trigger não tiver inserido)
    INSERT INTO public.profiles (id, email, role)
    VALUES (test_id, test_email, 'editor')
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✅ Usuário de Teste Criado: % | Senha: 123456', test_email;
END $$;
