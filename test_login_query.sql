-- TESTE DE VERIFICAÇÃO DE SENHA (A Prova Real)
-- Esse script simula EXATAMENTE a query de login (verificar e-mail e senha).
-- Roda como 'service_role' (o sistema).

DO $$
DECLARE
    found_id UUID;
BEGIN
    -- 1. Virar o Sistema
    SET LOCAL ROLE service_role;
    
    RAISE NOTICE 'Role: service_role. Tentando validar senha...';
    
    -- 2. Tentar encontrar o usuário checando a senha
    -- Se a função 'crypt' não estiver visível pro service_role, vai dar ERRO aqui.
    SELECT id INTO found_id
    FROM auth.users
    WHERE email = 'teste_supremo@tetracom.com'
    AND encrypted_password = crypt('123456', encrypted_password);
    
    -- 3. Resultado
    IF found_id IS NOT NULL THEN
        RAISE NOTICE '✅ SUCESSO! O banco confirmou a senha. Login deveria funcionar.';
    ELSE
        RAISE NOTICE '❌ FALHA! Usuário não encontrado ou senha não bateu.';
        RAISE NOTICE 'Se deu erro de SQL antes dessa linha, copie o erro!';
    END IF;

    RESET ROLE;
EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RAISE NOTICE '🚨 CRASH: % (SQLState: %)', SQLERRM, SQLSTATE;
    RAISE NOTICE 'Isso confirma que o service_role não consegue usar a criptografia!';
END $$;
