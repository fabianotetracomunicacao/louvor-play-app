-- DIAGNÓSTICO PROFUNDO DO SISTEMA DE AUTH
-- Verifica Triggers, Extensões e RLS nas tabelas internas do Auth.

DO $$
DECLARE
    r RECORD;
    ext_count INT;
    test_crypt TEXT;
BEGIN
    RAISE NOTICE '=== 1. VERIFICANDO GATILHOS (TRIGGERS) EM AUTH.USERS ===';
    FOR r IN (
        SELECT trigger_name, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    ) LOOP
        RAISE NOTICE '⚠️ GATILHO ENCONTRADO: % (Ação: %)', r.trigger_name, r.action_statement;
    END LOOP;

    RAISE NOTICE '=== 2. VERIFICANDO EXTENSÃO PGCRYPTO ===';
    SELECT count(*) INTO ext_count FROM pg_available_extensions WHERE name = 'pgcrypto' AND installed_version IS NOT NULL;
    IF ext_count = 0 THEN
        RAISE NOTICE '❌ ERRO CRÍTICO: pgcrypto NÃO está instalada!';
    ELSE
        RAISE NOTICE '✅ pgcrypto está instalada.';
        -- Teste de criptografia
        BEGIN
            test_crypt := crypt('teste', gen_salt('bf'));
            RAISE NOTICE '✅ Teste de criptografia (crypt) funcionou.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO AO USAR CRYPT: %', SQLERRM;
        END;
    END IF;

    RAISE NOTICE '=== 3. VERIFICANDO RLS EM TABELAS DE SESSÃO ===';
    FOR r IN (
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'auth' AND tablename IN ('sessions', 'refresh_tokens', 'identities')
    ) LOOP
        RAISE NOTICE 'Tabela auth.%: RLS Ativo? %', r.tablename, r.rowsecurity;
        IF r.rowsecurity = true THEN
             RAISE NOTICE '   ⚠️ ATENÇÃO: RLS ativo em tabela interna do Auth pode causar problemas se mal configurado.';
        END IF;
    END LOOP;

    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;
