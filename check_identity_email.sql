-- VERIFICAÇÃO CRÍTICA: Campo 'email' em auth.identities
-- Este é um campo GERADO automaticamente.
-- Se estiver NULL ou errado, o login quebra!

SELECT 
    u.email as user_email,
    i.email as identity_email,
    i.provider_id,
    CASE 
        WHEN i.email IS NULL THEN '❌ NULL (CRÍTICO!)'
        WHEN i.email = u.email THEN '✅ Correto'
        ELSE '⚠️ Diferente'
    END as status_email
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN (
    'login_test@teste.com',
    'testequarto@hotmail.com',
    'novapessoa2@hotmail.com'
)
ORDER BY u.created_at;
