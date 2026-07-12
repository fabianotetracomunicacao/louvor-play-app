-- Create SETLISTS table
create table if not exists public.setlists (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  name text not null,
  description text,
  date date, -- Optional date for the event/service
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create SETLIST_ITEMS table
create table if not exists public.setlist_items (
  id uuid default gen_random_uuid() primary key,
  setlist_id uuid references public.setlists(id) on delete cascade not null,
  song_id uuid references public.songs(id) on delete cascade not null,
  position integer not null default 0,
  usage_type text, -- 'Abertura', 'Ceia', 'Adoração', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes
create index if not exists idx_setlists_playlist on public.setlists(playlist_id);
create index if not exists idx_setlist_items_setlist on public.setlist_items(setlist_id);
create index if not exists idx_setlist_items_song on public.setlist_items(song_id);

-- Enable RLS
alter table public.setlists enable row level security;
alter table public.setlist_items enable row level security;

-- Policies for SETLISTS
-- View: If user can view the parent playlist (public or member)
create policy "Setlists are viewable by everyone" 
  on public.setlists for select 
  using ( true ); -- Simplified for read, typically restricted to playlist visibility but let's be open for now or mirror playlist. 
  -- Ideally: exist (select 1 from playlists p where p.id = playlist_id and (p.is_public = true or p.owner_id = auth.uid() or exists(select 1 from playlist_members pm where pm.playlist_id = p.id and pm.user_id = auth.uid())))

-- Insert/Update/Delete: If user is owner or editor of parent playlist
create policy "Setlists editable by playlist editors"
  on public.setlists for all
  using (
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
          -- Optionally check pm.role = 'editor'
        )
      )
    )
  );


-- Policies for SETLIST_ITEMS
-- View: Public (simplification)
create policy "Setlist items viewable by everyone"
  on public.setlist_items for select
  using ( true );

-- Edit: Inherit from setlist -> playlist
create policy "Setlist items editable by playlist editors"
  on public.setlist_items for all
  using (
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

-- Function to handle timestamp update
create or replace function public.handle_setlists_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger setlists_updated_at
  before update on public.setlists
  for each row
  execute procedure public.handle_setlists_updated_at();
