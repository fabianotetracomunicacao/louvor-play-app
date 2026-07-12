-- Verificar senha do testeoitavo
SELECT 
    email,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_123456_ok,
    substring(encrypted_password, 1, 10) as hash_prefix
FROM auth.users
WHERE email = 'testeoitavo@hotmail.com';
