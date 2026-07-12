-- Garante que membros de playlists possam ver quem mais é membro
-- (Essencial para enviar notificações corretamente)

drop policy if exists "Members can view other members" on playlist_members;

create policy "Members can view other members"
on playlist_members for select
to authenticated
using (
    -- Usuário pode ver se ele mesmo é membro da playlist OU se é o dono da playlist
    exists (
        select 1 from playlist_members pm
        where pm.playlist_id = playlist_members.playlist_id
        and pm.user_id = auth.uid()
    )
    OR
    exists (
        select 1 from playlists p
        where p.id = playlist_members.playlist_id
        and p.owner_id = auth.uid()
    )
);
