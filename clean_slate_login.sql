-- CLEAN SLATE LOGIN (Limpeza Total de Auth)
-- Remove travas ocultas que podem estar impedindo o login.

DO $$
BEGIN
    -- 1. Remover TODOS os gatilhos da tabela de usuários (INSERT e UPDATE)
    -- Se houver algum trigger "on_auth_user_updated" quebrado, ele mata o login.
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users; -- Nome comum
    DROP TRIGGER IF EXISTS check_for_duplicate_emails ON auth.users;
    
    -- 2. Garantir que RLS está DESLIGADO no Auth (Pulei pq o Supabase protege essa tabela)
    -- ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
    
    -- 3. Garantir RLS desligado em Profiles
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

    -- 4. Resetar a senha do Fabiano para '123456' (Garantia de que a senha está certa formatada)
    UPDATE auth.users 
    SET encrypted_password = crypt('123456', gen_salt('bf')),
        email_confirmed_at = now(),
        aud = 'authenticated',
        role = 'authenticated'
    WHERE email = 'fabiano@tetracomunicacao.com.br';

    -- 5. Recarregar Schema Cache
    NOTIFY pgrst, 'reload';
    
    RAISE NOTICE '✅ Sistema de Login limpo. Senha definida para 123456';
END $$;
