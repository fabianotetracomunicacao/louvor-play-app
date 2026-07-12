-- TESTE DE UPDATE MANUAL (Simulando Login)
-- Se o login dá erro 500, provavelmente é um TRIGGER explodindo quando o Supabase tenta atualizar o 'last_sign_in_at'.
-- Vamos tentar fazer esse update na mão e ver se o banco grita.

DO $$
DECLARE
    v_email text := 'testesegundo@hotmail.com.br'; -- O Usuário problemático
BEGIN
    RAISE NOTICE 'Tentando atualizar last_sign_in_at para %...', v_email;

    UPDATE auth.users
    SET last_sign_in_at = now(),
        updated_at = now()
    WHERE email = v_email;

    IF NOT FOUND THEN
        RAISE NOTICE '❌ Usuário não encontrado! Verifique o email.';
    ELSE
        RAISE NOTICE '✅ UPDATE funcionou! O problema não é Trigger no auth.users.';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '🚨 ERRO CAPTURADO: %', SQLERRM;
    RAISE NOTICE 'O erro aconteceu ao tentar atualizar o usuário. Isso confirma que é um Trigger ou Restrição falhando.';
END $$;
