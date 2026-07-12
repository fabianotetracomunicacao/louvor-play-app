-- SUPER FORCE DELETE (Limpeza Total)
-- Remove o usuário de TODAS as tabelas possíveis antes de apagar o login.

DO $$
DECLARE
    target_email TEXT := 'juli.eichelberger@gmail.com';
    target_id UUID;
BEGIN
    -- 1. Achar o ID (Tenta Auth, depois Profiles)
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;
    
    IF target_id IS NULL THEN
        SELECT id INTO target_id FROM public.profiles WHERE email = target_email;
    END IF;

    IF target_id IS NULL THEN
        RAISE NOTICE 'Usuário já não existe mais no sistema.';
    ELSE
        RAISE NOTICE 'Removendo usuário % (ID: %)...', target_email, target_id;

        -- 2. Limpar dependências (A Ordem Importa!)
        
        -- A. Membros de Playlist (Colaborações)
        DELETE FROM public.playlist_members WHERE user_id = target_id;
        
        -- B. Músicas (Se sobrou alguma)
        DELETE FROM public.songs WHERE created_by = target_id;
        
        -- C. Playlists (Se sobrou alguma)
        DELETE FROM public.playlists WHERE owner_id = target_id;

        -- D. Perfil (Dados públicos)
        DELETE FROM public.profiles WHERE id = target_id;

        -- E. Login (A conta em si) - A fonte da verdade
        DELETE FROM auth.users WHERE id = target_id;
        
        RAISE NOTICE 'SUCESSO TOTAL: Usuário removido de todas as tabelas.';
    END IF;
END $$;
