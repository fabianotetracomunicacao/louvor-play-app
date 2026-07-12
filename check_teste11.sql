-- Verificar teste11
SELECT 
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
FROM auth.users
WHERE email LIKE 'teste11%';

-- Verificar identity
SELECT 
    u.email,
    i.identity_data,
    i.provider_id,
    u.id::text as user_id
FROM auth.users u
JOIN auth.identities i ON i.user_id = u.id
WHERE u.email LIKE 'teste11%';
