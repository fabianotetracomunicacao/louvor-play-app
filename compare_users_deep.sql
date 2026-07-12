-- COMPARAÇÃO MORTAL: LoginTest vs TesteQuarto
-- Vamos achar a diferença, nem que tenha que olhar bit a bit.

SELECT 
    email,
    id,
    aud,
    role,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user
FROM auth.users
WHERE email IN ('login_test@teste.com', 'testequarto@hotmail.com');
