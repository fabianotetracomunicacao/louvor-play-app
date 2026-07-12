-- ESTADO DO USUÁRIO
-- Vamos ver se o update de email funcionou e como está a senha.

SELECT 
    id, 
    email, 
    email_confirmed_at, 
    encrypted_password,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'testeterceiro@hotmail.com';
