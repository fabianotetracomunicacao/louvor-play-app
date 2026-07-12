-- Corrige o erro de "infinite recursion" (recursão infinita)
-- Cria uma função segura (Security Definer) para verificar membros sem acionar repetição de regras

create or replace function is_playlist_member_secure(_playlist_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from playlist_members
    where playlist_id = _playlist_id
    and user_id = auth.uid()
  );
$$;

drop policy if exists "Members can view other members" on playlist_members;

create policy "Members can view other members"
on playlist_members for select
to authenticated
using (
    -- 1. O próprio usuário vendo sua linha
    user_id = auth.uid()
    OR
    -- 2. Membros da mesma playlist vendo os outros (usando a função segura)
    is_playlist_member_secure(playlist_id)
    OR
    -- 3. O Dono da playlist vendo os membros
    exists (
        select 1 from playlists p
        where p.id = playlist_members.playlist_id
        and p.owner_id = auth.uid()
    )
);
