-- Verificar confirmação de email
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    (email_confirmed_at IS NOT NULL) as email_confirmado,
    (confirmed_at IS NOT NULL) as usuario_confirmado
FROM auth.users
WHERE email IN ('testeoitavo@hotmail.com', 'testesetimo@hotmail.com', 'testesexto@hotmail.com')
ORDER BY created_at DESC;
