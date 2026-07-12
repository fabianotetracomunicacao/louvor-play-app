-- Query 2: Verificar identity
SELECT 
    u.email,
    i.identity_data,
    i.provider_id,
    u.id::text as user_id,
    i.provider_id = u.id::text as provider_id_correto
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email = 'teste12@hotmail.com';
