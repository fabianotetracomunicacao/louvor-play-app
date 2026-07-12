-- FIX: Remover phone_verified do identity_data
-- Hipótese: O campo "phone_verified": false está quebrando o login.
-- Vamos limpar o JSON para ficar igual aos usuários que funcionam.

UPDATE auth.identities
SET identity_data = identity_data - 'phone_verified'
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('testequarto@hotmail.com', 'novapessoa@teste.com')
);

-- Verificar o resultado
SELECT 
    u.email,
    i.identity_data->>'email_verified' as email_verified,
    i.identity_data->>'phone_verified' as phone_verified,
    jsonb_pretty(i.identity_data) as json_limpo
FROM auth.users u
JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN ('testequarto@hotmail.com', 'novapessoa@teste.com');
