-- Check Content for Fabiano
-- Finds the user by email and counts their Songs and Playlists

DO $$
DECLARE
    target_email TEXT := 'fabiano@tetracomuncacao.com.br'; -- (sic) keeping your spelling
    target_id UUID;
    song_count INT;
    playlist_count INT;
BEGIN
    -- 1. Find ID in Auth (or profiles if auth is gone, but usually auth is the anchor)
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;

    -- Fallback: Check profiles if not in auth
    IF target_id IS NULL THEN
        SELECT id INTO target_id FROM public.profiles WHERE email = target_email;
    END IF;

    IF target_id IS NULL THEN
        RAISE NOTICE 'Usuário % não encontrado (nem em Auth nem em Profiles).', target_email;
    ELSE
        -- 2. Count Songs
        SELECT count(*) INTO song_count FROM public.songs WHERE created_by = target_id;
        
        -- 3. Count Playlists (assuming playlists have user_id or similar)
        -- Checking if 'public.playlists' exists and has 'owner_id' or 'user_id'
        -- Adjust column name 'updated_by' or 'user_id' based on schema. Assuming 'created_by' or similar.
        -- We'll check 'created_by' based on songs pattern, or 'owner_id'.
        -- Let's assume 'created_by' for consistency, but wrap in exception block if column missing
        BEGIN
             SELECT count(*) INTO playlist_count FROM public.playlists WHERE user_id = target_id;
        EXCEPTION WHEN OTHERS THEN
             playlist_count := -1; -- Indicates checking failed (column might be different)
        END;

        RAISE NOTICE '=========================================';
        RAISE NOTICE 'RELATÓRIO DE CONTEÚDO para % (ID: %)', target_email, target_id;
        RAISE NOTICE 'Músicas criadas: %', song_count;
        RAISE NOTICE 'Playlists: % (Se -1, tabela playlists tem estrutura diferente)', playlist_count;
        RAISE NOTICE '=========================================';

        IF song_count > 0 THEN
            RAISE NOTICE '⚠️ ATENÇÃO: Este usuário tem músicas. A exclusão forçada vai falhar a menos que você TRANSFIRA essas músicas antes (usando o painel de Admin do app).';
        ELSE
            RAISE NOTICE '✅ Limpo: Usuário não tem músicas vinculadas.';
        END IF;
    END IF;
END $$;
