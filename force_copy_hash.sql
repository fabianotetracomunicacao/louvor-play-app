-- TESTE DEFINITIVO DE SENHA
-- Vamos copiar a senha CRIPTOGRAFADA do Fabiano (que funciona) para o TesteSegundo.
-- Se funcionar, sabemos que o problema é a função de criptografia (pgcrypto).

DO $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = (
        SELECT encrypted_password 
        FROM auth.users 
        WHERE email = 'fabiano@tetracomunicacao.com.br' -- Usuário Doador (Funciona)
    )
    WHERE email = 'testesegundo@hotmail.com.br'; -- Usuário Receptor (Não funciona)

    RAISE NOTICE 'Senha copiada! Tente logar com o TesteSegundo usando a MESMA senha do Fabiano.';
END $$;
