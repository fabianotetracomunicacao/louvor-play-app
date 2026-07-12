-- DELETE TOTAL DO USUÁRIO DE TESTE
-- Vamos limpar o terreno para testar o cadastro via Interface (Frontend).

DO $$
DECLARE
    v_email text := 'testesegundo@hotmail.com.br';
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        -- 1. Remove do public.profiles
        DELETE FROM public.profiles WHERE id = v_user_id;
        
        -- 2. Remove identidades
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        
        -- 3. Remove o usuário em si
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Usuário % removido com sucesso.', v_email;
    ELSE
        RAISE NOTICE '⚠️ Usuário % não encontrado (já foi removido?).', v_email;
    END IF;
END $$;
