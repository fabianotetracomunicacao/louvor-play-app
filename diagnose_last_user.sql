-- Diagnosticar último usuário criado pelo app
SELECT 
    'ÚLTIMO USUÁRIO CRIADO' as info,
    email,
    id,
    created_at,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_123456_ok
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Verificar identity do último usuário
SELECT 
    'IDENTITY DO ÚLTIMO USUÁRIO' as info,
    i.provider,
    i.provider_id,
    i.identity_data,
    i.identity_data->>'email' as email_in_identity,
    i.identity_data->>'sub' as sub_in_identity,
    u.email as email_real,
    u.id as user_id_real,
    (i.identity_data->>'email' = u.email) as email_match,
    (i.identity_data->>'sub' = u.id::text) as sub_match
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);
