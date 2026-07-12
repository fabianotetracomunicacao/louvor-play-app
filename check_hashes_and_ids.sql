-- DETETIVE DE DIFERENÇAS 🕵️‍♂️
-- Vamos ver se tem alguma diferença estrutural (Instance ID, AUD) e se a senha foi copiada mesmo.

SELECT 
    email,
    instance_id,
    aud,
    role,
    substring(encrypted_password from 1 for 15) as hash_start, -- Vê o começo da senha
    (encrypted_password = (SELECT encrypted_password FROM auth.users WHERE email = 'fabiano@tetracomunicacao.com.br')) as has_same_password_as_fabiano
FROM auth.users
WHERE email IN ('fabiano@tetracomunicacao.com.br', 'testesegundo@hotmail.com.br');
