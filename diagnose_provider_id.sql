-- VERIFICAÇÃO CRÍTICA: provider_id
-- Hipótese: Usuários criados pelo App têm provider_id NULL ou malformado.
-- Usuários criados via SQL têm provider_id correto (= email).

SELECT 
    u.email,
    u.created_at,
    i.provider_id,
    i.provider,
    i.id as identity_id,
    i.user_id,
    CASE 
        WHEN i.provider_id IS NULL THEN '❌ NULL (PROBLEMA!)'
        WHEN i.provider_id = u.email THEN '✅ Correto'
        ELSE '⚠️ Diferente do email'
    END as status_provider_id
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN (
    'testequarto@hotmail.com',      -- App (Falha)
    'novapessoa@teste.com',          -- App (Falha)
    'novapessoa2@hotmail.com',       -- SQL (Funciona)
    'login_test@teste.com'           -- SQL (Funciona)
)
ORDER BY u.created_at;
