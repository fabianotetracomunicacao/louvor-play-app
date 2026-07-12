-- FIX RELATIONSHIPS & PERMISSIONS (CORRECTED)

-- 1. Ensure Foreign Key is named correctly for PostgREST detection
alter table public.playlist_items 
drop constraint if exists playlist_items_song_id_fkey;

alter table public.playlist_items 
add constraint playlist_items_song_id_fkey 
foreign key (song_id) 
references public.songs(id) 
on delete cascade;

-- 2. Verify RLS Policies for Songs (Crucial for JOIN)
drop policy if exists "Enable access to all users" on songs;
drop policy if exists "Songs are viewable by everyone" on songs;

create policy "Songs are viewable by everyone" 
on public.songs for select 
using (true);

-- 3. Verify Profiles Access (for 'Created By')
-- DROP BEFORE CREATING to avoid "already exists" error
drop policy if exists "Public profiles are viewable by everyone" on profiles;

create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

-- 4. Reload Schema Cache (Metadata)
NOTIFY pgrst, 'reload config';
