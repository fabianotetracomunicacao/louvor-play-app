-- Comparar auth.identities
SELECT 
    'testesexto' as usuario,
    provider,
    provider_id,
    id,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com')

UNION ALL

SELECT 
    'novapessoa2' as usuario,
    provider,
    provider_id,
    id,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'novapessoa2@hotmail.com');
