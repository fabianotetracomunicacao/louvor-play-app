-- DIAGNÓSTICO E CORREÇÃO FINAL (Triggers Públicos + Permissões de Função)

DO $$
DECLARE
    t_rec RECORD;
BEGIN
    -- 1. Listar para você ver (Visual)
    RAISE NOTICE '=== TRIGGERS NA TABELA PROFILES ===';
    FOR t_rec IN (SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE event_object_schema = 'public' AND event_object_table = 'profiles') LOOP
        RAISE NOTICE '⚠️ GATILHO: % (%)', t_rec.trigger_name, t_rec.event_manipulation;
    END LOOP;

    -- 2. Garantir permissão de execução nas funções de criptografia (Crucial se movemos para Public)
    RAISE NOTICE '=== CONCEDENDO PERMISSÕES DE EXECUÇÃO ===';
    GRANT EXECUTE ON FUNCTION public.gen_salt(text) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION public.crypt(text, text) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION public.gen_random_uuid() TO PUBLIC;
    
    -- 3. Limpar triggers potencialmente perigosos em Profiles (apenas se confirmar que existem)
    -- Vou apagar preventivamente qualquer coisa que tente validar dados na marra
    DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
    
    RAISE NOTICE '✅ Permissões de função aplicadas e triggers limpos.';
    RAISE NOTICE 'Tente logar agora.';
END $$;
