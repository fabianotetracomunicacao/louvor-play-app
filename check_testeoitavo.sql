-- Verificar se testeoitavo foi corrigido
SELECT 
    u.email,
    i.identity_data,
    i.identity_data->>'email' as email_in_identity,
    i.identity_data->>'sub' as sub_in_identity,
    (i.identity_data->>'email' = u.email) as email_match,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
FROM auth.users u
JOIN auth.identities i ON i.user_id = u.id
WHERE u.email LIKE 'testeoitavo%';
