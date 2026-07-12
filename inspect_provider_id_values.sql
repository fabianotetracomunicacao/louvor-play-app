-- INSPEÇÃO DETALHADA: Valores Exatos do provider_id
-- Vamos ver o que tem dentro desse campo em cada usuário.

SELECT 
    u.email,
    i.provider_id,
    length(i.provider_id) as tamanho,
    i.provider_id = u.email as eh_igual_email,
    u.created_at
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN (
    'testequarto@hotmail.com',
    'novapessoa@teste.com',
    'novapessoa2@hotmail.com',
    'login_test@teste.com'
)
ORDER BY u.created_at;
