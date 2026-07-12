-- DIAGNÓSTICO DE EXTENSÕES E UPDATE MANUAL
-- 1. Lista todas as extensões (uuid-ossp é essencial)
SELECT extname, extnamespace::regnamespace 
FROM pg_extension;

-- 2. Tenta confirmar o email via SQL (Se falhar aqui, o banco está bloqueando writes)
DO $$
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE email = 'testeterceiro@hotmail.com';
    
    RAISE NOTICE '✅ Update de confirmação rodou com sucesso!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FALHA AO ATUALIZAR USUÁRIO: %', SQLERRM;
END $$;
