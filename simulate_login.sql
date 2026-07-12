-- SIMULAÇÃO MANUAL DE LOGIN
-- Vamos tentar fazer o que o Supabase faz (Atualizar o last_sign_in_at)
-- Isso deve revelar o erro REAL que está escondido atrás do "Erro 500".

DO $$
DECLARE
    target_email TEXT := 'teste_supremo@tetracom.com';
    u_id UUID;
BEGIN
    SELECT id INTO u_id FROM auth.users WHERE email = target_email;

    IF u_id IS NULL THEN
        RAISE EXCEPTION 'Usuário teste não encontrado!';
    END IF;

    RAISE NOTICE 'Tentando atualizar usuário % (ID: %)...', target_email, u_id;

    -- Simula o UPDATE do login
    UPDATE auth.users 
    SET last_sign_in_at = now() 
    WHERE id = u_id;
    
    RAISE NOTICE '✅ SUCESSO! O Update funcionou no banco de dados.';
    RAISE NOTICE 'Se aqui funciona mas no site não, o problema é no servidor do Supabase (GoTrue).';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO AO ATUALIZAR: % (SQLState: %)', SQLERRM, SQLSTATE;
END $$;
