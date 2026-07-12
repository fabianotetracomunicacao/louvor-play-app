-- FIX GOD PERMISSIONS (Restaurar Permissões do Sistema)
-- Se o "Motor" de Autenticação (supabase_auth_admin) perder permissão, o login quebra (Erro 500).

DO $$
BEGIN
    -- 1. Restaurar permissões do Admin de Auth
    GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin, service_role, postgres;

    -- 2. Restaurar permissões no Public também (caso ele precise ler algo)
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;

    RAISE NOTICE '✅ Permissões do Sistema Restauradas.';

    -- 3. Verificação Extra: Gatilhos em OUTRAS tabelas do Auth (Sessions/Tokens)?
    -- Se tiver trigger aqui, pode quebrar o login também.
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (
            SELECT event_object_table, trigger_name 
            FROM information_schema.triggers 
            WHERE event_object_schema = 'auth' AND event_object_table != 'users'
        ) LOOP
             RAISE NOTICE '⚠️ AVISO: Gatilho encontrado em auth.%: %', r.event_object_table, r.trigger_name;
        END LOOP;
    END;
END $$;
