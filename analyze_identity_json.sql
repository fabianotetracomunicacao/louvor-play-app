-- ANÁLISE DO JSON: identity_data
-- Vamos ver o que tem DENTRO desse JSON em cada usuário.

SELECT 
    u.email,
    i.identity_data->>'sub' as sub,
    i.identity_data->>'email' as email_no_json,
    i.identity_data->>'email_verified' as email_verified,
    i.identity_data->>'phone_verified' as phone_verified,
    i.identity_data->>'provider' as provider_no_json,
    jsonb_pretty(i.identity_data) as json_completo
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN (
    'login_test@teste.com',      -- SQL (Funciona)
    'testequarto@hotmail.com',   -- App (Falha)
    'novapessoa2@hotmail.com'    -- SQL (Funciona)
)
ORDER BY u.created_at;
