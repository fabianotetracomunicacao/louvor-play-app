-- CRIAÇÃO MANUAL DE PERFIL (Forçada)
-- Se o login funciona mas a tela fica em branco, falta o perfil.
-- Vamos criar na marra.

DO $$
DECLARE
    v_user_email text := 'testesegundo@hotmail.com.br';
    v_user_id uuid;
BEGIN
    -- 1. Pega o ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário auth.users não encontrado!';
    END IF;

    -- 2. Tenta inserir o perfil
    INSERT INTO public.profiles (id, email, name, role, created_at)
    VALUES (v_user_id, v_user_email, 'TesteSegundo', 'musician', now())
    ON CONFLICT (id) DO UPDATE 
    SET name = 'TesteSegundo (Recriado)';
    
    RAISE NOTICE '✅ Perfil criado/atualizado com sucesso para ID: %', v_user_id;

END $$;
