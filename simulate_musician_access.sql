-- SIMULAÇÃO DE ACESSO (MÚSICO)
-- Vamos fingir ser o testesegundo e tentar ler as tabelas que o App carrega no início.
-- ID: 3ea71fdf-6b97-4fa6-8ba5-fea8158f9f7d

SET ROLE authenticated;
SET request.jwt.claim.sub = '3ea71fdf-6b97-4fa6-8ba5-fea8158f9f7d';

DO $$
DECLARE
    v_count integer;
BEGIN
    RAISE NOTICE '🎸 Testando acesso como MÚSICO...';

    -- 1. Tentar ler Músicas
    SELECT count(*) INTO v_count FROM public.songs;
    RAISE NOTICE '   - Songs: % (Se der erro aqui, RLS bloqueou)', v_count;

    -- 2. Tentar ler Estilos
    SELECT count(*) INTO v_count FROM public.musical_styles;
    RAISE NOTICE '   - Styles: %', v_count;

    -- 3. Tentar ler Funções
    SELECT count(*) INTO v_count FROM public.song_functions;
    RAISE NOTICE '   - Functions: %', v_count;
    
    -- 4. Tentar ler Playlists
    SELECT count(*) INTO v_count FROM public.playlists;
    RAISE NOTICE '   - Playlists: %', v_count;

    RAISE NOTICE '✅ Teste concluído sem explodir erros de permissão.';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '❌ ERRO DE PERMISSÃO (RLS) DETECTADO!';
    RAISE NOTICE '   Detalhe: %', SQLERRM;
WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO GENÉRICO: %', SQLERRM;
END $$;
