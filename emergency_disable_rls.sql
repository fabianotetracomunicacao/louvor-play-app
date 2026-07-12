-- EMERGENCY DISABLE RLS (Temporário)
-- Use isto apenas para destravar o login.
-- Se funcionar, sabemos que o problema são as regras de segurança ("Policies").

DO $$
BEGIN
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ Segurança da tabela PROFILES foi desligada temporariamente.';
    RAISE NOTICE 'Tente fazer login agora.';
END $$;
