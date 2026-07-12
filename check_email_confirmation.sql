-- CHECAGEM DE CONFIRMAÇÃO DE EMAIL
-- O usuário existe e tem perfil. Mas será que confirmou o email?

SELECT email, email_confirmed_at, last_sign_in_at
FROM auth.users
WHERE email = 'testequarto@hotmail.com';
