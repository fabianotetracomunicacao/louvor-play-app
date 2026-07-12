-- LISTAR GATILHOS (TRIGGERS) - PROCURANDO O CULPADO DO 500
-- Mostra no log (Messages) quais robôs estão vigiando a tabela auth.users.

DO $$
DECLARE
    r RECORD;
    v_found boolean := false;
BEGIN
    RAISE NOTICE '🔍 Iniciando varredura de Triggers em auth.users...';
    RAISE NOTICE '---------------------------------------------------';

    FOR r IN 
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth' 
          AND event_object_table = 'users'
    LOOP
        v_found := true;
        RAISE NOTICE '🔴 GATILHO ENCONTRADO: %', r.trigger_name;
        RAISE NOTICE '   Evento: %', r.event_manipulation;
        RAISE NOTICE '   Ação: %', substring(r.action_statement from 1 for 100) || '...'; -- Limita tamanho
        RAISE NOTICE '---------------------------------------------------';
    END LOOP;

    IF NOT v_found THEN
        RAISE NOTICE '✅ Nenhum gatilho encontrado em auth.users (Isso é raro no Supabase!)';
    ELSE
        RAISE NOTICE '⚠️ Verifique se algum desses gatilhos é "customizado" e pode estar quebrado.';
    END IF;
END $$;
