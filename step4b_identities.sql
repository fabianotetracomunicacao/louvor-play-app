-- auth.identities do novapessoa2
SELECT 
    provider_id,
    id,
    user_id,
    jsonb_pretty(identity_data) as identity_data_formatted,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    email
FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'novapessoa2@hotmail.com');
