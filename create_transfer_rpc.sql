-- CRIAÇÃO DA FUNÇÃO DE TRANSFERÊNCIA E EXCLUSÃO
-- Essa função é chamada pelo Frontend quando o admin escolhe um sucessor.

CREATE OR REPLACE FUNCTION public.delete_user_with_transfer(
    successor_id UUID,
    target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com poderes de admin para poder alterar donos e deletar users
AS $$
BEGIN
    -- 1. Transfere as músicas
    UPDATE public.songs
    SET created_by = successor_id
    WHERE created_by = target_user_id;

    -- 2. Transfere as playlists (se houver lógica para isso, senão opcional)
    UPDATE public.playlists
    SET owner_id = successor_id
    WHERE owner_id = target_user_id;

    -- 3. Exclui o usuário (O resto deve ir em cascade)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    -- (Opcional) Log de auditoria ou aviso
    RAISE NOTICE 'Usuário % deletado e ativos transferidos para %', target_user_id, successor_id;
END;
$$;

-- Permissões para o Admin usar
GRANT EXECUTE ON FUNCTION public.delete_user_with_transfer(UUID, UUID) TO service_role, supabase_auth_admin, authenticated; -- Authenticated pq o admin logado é 'authenticated'
