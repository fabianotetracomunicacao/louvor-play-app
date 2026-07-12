-- Verificar último usuário criado (teste12)
SELECT 
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    email_confirmed_at IS NOT NULL as email_confirmado,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
FROM auth.users
WHERE email LIKE 'teste12%';

-- Verificar identity
SELECT 
    u.email,
    i.identity_data,
    i.provider_id = u.id::text as provider_id_ok
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email LIKE 'teste12%';

-- Verificar profile
SELECT 
    u.email,
    p.id IS NOT NULL as tem_profile,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email LIKE 'teste12%';
