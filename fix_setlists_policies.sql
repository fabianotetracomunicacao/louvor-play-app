-- Enable RLS on tables (idempotent)
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

-- 1. Policies for SETLISTS

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Setlists are viewable by everyone" ON public.setlists;
DROP POLICY IF EXISTS "Setlists editable by playlist editors" ON public.setlists;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.setlists;
DROP POLICY IF EXISTS "Enable insert for playlist owners and editors" ON public.setlists;
DROP POLICY IF EXISTS "Enable update for playlist owners and editors" ON public.setlists;
DROP POLICY IF EXISTS "Enable delete for playlist owners and editors" ON public.setlists;

-- CREATE new policies

-- READ: Allow everyone to see setlists (or restrict to playlist visibility if preferred, but keeping it simple for now)
CREATE POLICY "Enable read access for all users"
ON public.setlists FOR SELECT
USING (true);

-- WRITE (Insert/Update/Delete): Allow playlist Owners and Editors
CREATE POLICY "Enable write access for playlist owners and editors"
ON public.setlists FOR ALL
USING (
  exists (
    select 1 from public.playlists p 
    where p.id = playlist_id 
    and (
      p.owner_id = auth.uid() 
      or exists (
        select 1 from public.playlist_members pm 
        where pm.playlist_id = p.id 
        and pm.user_id = auth.uid() 
        and pm.status = 'accepted'
      )
    )
  )
)
WITH CHECK (
  exists (
    select 1 from public.playlists p 
    where p.id = playlist_id 
    and (
      p.owner_id = auth.uid() 
      or exists (
        select 1 from public.playlist_members pm 
        where pm.playlist_id = p.id 
        and pm.user_id = auth.uid() 
        and pm.status = 'accepted'
      )
    )
  )
);

-- 2. Policies for SETLIST_ITEMS

DROP POLICY IF EXISTS "Setlist items viewable by everyone" ON public.setlist_items;
DROP POLICY IF EXISTS "Setlist items editable by playlist editors" ON public.setlist_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.setlist_items;
DROP POLICY IF EXISTS "Enable write access for playlist owners and editors" ON public.setlist_items;

-- READ
CREATE POLICY "Enable read access for all users"
ON public.setlist_items FOR SELECT
USING (true);

-- WRITE
CREATE POLICY "Enable write access for playlist owners and editors"
ON public.setlist_items FOR ALL
USING (
  exists (
    select 1 from public.setlists s
    join public.playlists p on s.playlist_id = p.id
    where s.id = setlist_id
    and (
      p.owner_id = auth.uid() 
      or exists (
        select 1 from public.playlist_members pm 
        where pm.playlist_id = p.id 
        and pm.user_id = auth.uid() 
        and pm.status = 'accepted'
      )
    )
  )
)
WITH CHECK (
  exists (
    select 1 from public.setlists s
    join public.playlists p on s.playlist_id = p.id
    where s.id = setlist_id
    and (
      p.owner_id = auth.uid() 
      or exists (
        select 1 from public.playlist_members pm 
        where pm.playlist_id = p.id 
        and pm.user_id = auth.uid() 
        and pm.status = 'accepted'
      )
    )
  )
);
