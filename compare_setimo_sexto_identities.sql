-- Comparar auth.identities
SELECT 
    'testesetimo (FALHA)' as origem,
    provider,
    provider_id,
    id,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at,
    email
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com')

UNION ALL

SELECT 
    'testesexto (FUNCIONA)' as origem,
    provider,
    provider_id,
    id,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at,
    email
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');
