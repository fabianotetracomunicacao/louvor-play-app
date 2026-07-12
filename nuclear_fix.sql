-- NUCLEAR FIX (Vale Tudo)
-- Objetivo: Destravar o Login a qualquer custo.

DO $$
BEGIN
    -- 1. Remover Gatilhos (Triggers) suspeitos da tabela de usuários
    -- Se o gatilho 'on_auth_user_created' estiver bugado, ele pode travar tudo.
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- 2. "Desativar" a segurança da tabela de Perfis
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

    -- 3. Forçar atualização do Cache do Supabase (para ele 'perceber' as mudanças)
    NOTIFY pgrst, 'reload';
    
    RAISE NOTICE '✅ Triggers removidos e Segurança desligada. Tente logar!';
END $$;
