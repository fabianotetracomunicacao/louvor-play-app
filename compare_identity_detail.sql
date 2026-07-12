-- Comparar identity_data detalhado
SELECT 
    'testesetimo' as usuario,
    i.provider,
    i.provider_id,
    i.user_id,
    i.identity_data,
    i.identity_data->>'sub' as sub_identity,
    i.identity_data->>'email' as email_identity,
    i.identity_data->>'email_verified' as email_verified,
    i.identity_data->>'phone_verified' as phone_verified,
    u.id as user_id_real,
    (i.user_id = u.id) as user_id_match,
    (i.identity_data->>'sub' = u.id::text) as sub_match
FROM auth.identities i
JOIN auth.users u ON u.email = 'testesetimo@hotmail.com'
WHERE i.user_id = u.id

UNION ALL

SELECT 
    'testesexto' as usuario,
    i.provider,
    i.provider_id,
    i.user_id,
    i.identity_data,
    i.identity_data->>'sub' as sub_identity,
    i.identity_data->>'email' as email_identity,
    i.identity_data->>'email_verified' as email_verified,
    i.identity_data->>'phone_verified' as phone_verified,
    u.id as user_id_real,
    (i.user_id = u.id) as user_id_match,
    (i.identity_data->>'sub' = u.id::text) as sub_match
FROM auth.identities i
JOIN auth.users u ON u.email = 'testesexto@hotmail.com'
WHERE i.user_id = u.id;
