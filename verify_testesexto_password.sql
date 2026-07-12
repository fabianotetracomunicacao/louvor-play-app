-- Verificar o hash da senha do testesexto
DO $$
DECLARE
    stored_hash text;
    test_password text := 'Teste@123';
    verification_result boolean;
BEGIN
    -- Pegar o hash armazenado
    SELECT encrypted_password INTO stored_hash
    FROM auth.users
    WHERE email = 'testesexto@hotmail.com';
    
    RAISE NOTICE 'Hash armazenado: %', stored_hash;
    
    -- Tentar verificar a senha
    verification_result := (stored_hash = extensions.crypt(test_password, stored_hash));
    
    RAISE NOTICE 'Senha "Teste@123" verifica: %', verification_result;
    
    -- Testar com senha vazia
    verification_result := (stored_hash = extensions.crypt('', stored_hash));
    RAISE NOTICE 'Senha vazia verifica: %', verification_result;
    
    -- Comparar com hash do novapessoa2 (que funciona)
    RAISE NOTICE '=== COMPARAÇÃO ===';
    RAISE NOTICE 'Hash testesexto: %', stored_hash;
    RAISE NOTICE 'Hash novapessoa2: %', (SELECT encrypted_password FROM auth.users WHERE email = 'novapessoa2@hotmail.com');
    
END $$;
