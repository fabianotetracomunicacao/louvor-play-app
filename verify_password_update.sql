-- Verificar se a senha foi atualizada
SELECT 
    email,
    LEFT(encrypted_password, 30) as password_hash,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok,
    updated_at
FROM auth.users
WHERE email = 'testesetimo@hotmail.com';
