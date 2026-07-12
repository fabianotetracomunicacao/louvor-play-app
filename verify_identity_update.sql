-- Verificar identity_data atualizado
SELECT 
    u.email,
    i.identity_data,
    i.identity_data->>'email' as email_in_identity,
    i.identity_data->>'sub' as sub_in_identity,
    i.identity_data->>'email_verified' as email_verified,
    u.id as user_id
FROM auth.users u
JOIN auth.identities i ON i.user_id = u.id
WHERE u.email = 'testesetimo@hotmail.com';
