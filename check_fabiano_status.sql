SELECT 
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO' 
        ELSE 'PENDENTE' 
    END as status
FROM auth.users
WHERE email LIKE 'fabiano%';
