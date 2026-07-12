-- DELETAR COMPLETAMENTE: testequarto
-- Vamos apagar TUDO relacionado a esse usuário e criar um novo via App.

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Pegar o ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'testequarto@hotmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado';
        RETURN;
    END IF;
    
    -- Deletar refresh tokens
    DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id::text;
    RAISE NOTICE 'Refresh tokens deletados';
    
    -- Deletar sessões
    DELETE FROM auth.sessions WHERE user_id = v_user_id;
    RAISE NOTICE 'Sessões deletadas';
    
    -- Deletar identidades
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    RAISE NOTICE 'Identidades deletadas';
    
    -- Deletar perfil
    DELETE FROM public.profiles WHERE id = v_user_id;
    RAISE NOTICE 'Perfil deletado';
    
    -- Deletar usuário
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE 'Usuário deletado';
    
    RAISE NOTICE '=== testequarto COMPLETAMENTE REMOVIDO ===';
END $$;

-- Verificar
SELECT 'Usuários restantes:' as info;
SELECT email FROM auth.users WHERE email LIKE '%teste%' ORDER BY created_at;
