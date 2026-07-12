-- Verificar senha do testesetimo
SELECT 
    email,
    encrypted_password,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_123456_ok,
    (encrypted_password = extensions.crypt('Teste@123', encrypted_password)) as senha_teste123_ok,
    (encrypted_password = extensions.crypt('', encrypted_password)) as senha_vazia_ok
FROM auth.users
WHERE email = 'testesetimo@hotmail.com';
