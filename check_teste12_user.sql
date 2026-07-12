-- Query 1: Verificar user data
SELECT 
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    email_confirmed_at IS NOT NULL as email_confirmado,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
FROM auth.users
WHERE email = 'teste12@hotmail.com';
