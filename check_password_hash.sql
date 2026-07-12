-- Verificar o hash da senha do testesexto (usando SELECT)
SELECT 
    'testesexto' as usuario,
    encrypted_password as hash_armazenado,
    (encrypted_password = extensions.crypt('Teste@123', encrypted_password)) as senha_correta,
    (encrypted_password = extensions.crypt('', encrypted_password)) as senha_vazia
FROM auth.users
WHERE email = 'testesexto@hotmail.com'

UNION ALL

SELECT 
    'novapessoa2' as usuario,
    encrypted_password as hash_armazenado,
    (encrypted_password = extensions.crypt('Teste@123', encrypted_password)) as senha_correta,
    (encrypted_password = extensions.crypt('', encrypted_password)) as senha_vazia
FROM auth.users
WHERE email = 'novapessoa2@hotmail.com';
