-- VERIFICAÇÃO DE SENHA (TESTEQUARTO)
-- Vamos ver se o banco consegue validar a senha '123456' contra o hash gravado.
-- Se der FALSO, o hash foi gerado de um jeito que o pgcrypto não entende.

SELECT 
    email, 
    (encrypted_password IS NOT NULL) as tem_senha,
    (public.crypt('123456', encrypted_password) = encrypted_password) as senha_confere
FROM auth.users
WHERE email = 'testequarto@hotmail.com';
