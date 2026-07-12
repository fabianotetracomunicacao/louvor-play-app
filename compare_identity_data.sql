-- Comparar identity_data em detalhe
SELECT 
    'testesetimo (FALHA)' as origem,
    provider,
    provider_id,
    identity_data::text as identity_data_raw,
    jsonb_pretty(identity_data) as identity_data_pretty,
    identity_data->'sub' as sub_field,
    identity_data->'email' as email_field
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com')

UNION ALL

SELECT 
    'testesexto (FUNCIONA)' as origem,
    provider,
    provider_id,
    identity_data::text as identity_data_raw,
    jsonb_pretty(identity_data) as identity_data_pretty,
    identity_data->'sub' as sub_field,
    identity_data->'email' as email_field
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');
