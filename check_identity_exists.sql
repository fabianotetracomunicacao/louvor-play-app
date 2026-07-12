-- Verificar se testesetimo tem identity
SELECT 
    u.email,
    u.id as user_id,
    (SELECT COUNT(*) FROM auth.identities WHERE user_id = u.id) as identity_count,
    (SELECT provider FROM auth.identities WHERE user_id = u.id LIMIT 1) as provider,
    (SELECT id FROM auth.identities WHERE user_id = u.id LIMIT 1) as identity_id
FROM auth.users u
WHERE u.email IN ('testesetimo@hotmail.com', 'testesexto@hotmail.com')
ORDER BY u.email;
