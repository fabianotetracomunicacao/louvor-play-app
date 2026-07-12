-- ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- ROLES ENUM (Safe creation)
do $$ begin
    create type user_role as enum ('admin', 'editor', 'musician');
exception
    when duplicate_object then null;
end $$;

-- PROFILES TABLE
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role user_role default 'musician'::user_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SONGS TABLE (Update existing)
create table if not exists songs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  artist text,
  content text,
  original_key text,
  font_size integer default 12,
  line_spacing float default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add created_by if not exists
do $$ begin
    alter table songs add column created_by uuid references profiles(id);
exception
    when duplicate_column then null;
end $$;

-- PLAYLISTS TABLE (Update existing)
create table if not exists playlists (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  songs jsonb default '[]'::jsonb, -- Legacy column, keeping for safety but moving to items
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add new columns if not exists
do $$ begin
    alter table playlists add column is_public boolean default false;
exception
    when duplicate_column then null;
end $$;

do $$ begin
    alter table playlists add column owner_id uuid references profiles(id) on delete cascade;
exception
    when duplicate_column then null;
end $$;

-- PLAYLIST ITEMS TABLE (New relational structure)
create table if not exists playlist_items (
  id uuid default uuid_generate_v4() primary key,
  playlist_id uuid references playlists(id) on delete cascade not null,
  song_id uuid references songs(id) on delete cascade not null,
  custom_transposition integer default 0, -- "Meu Tom"
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table songs enable row level security;
alter table playlists enable row level security;
alter table playlist_items enable row level security;

-- DROP ALL ACCESS POLICIES FIRST TO AVOID CONFLICTS ON RE-RUN
drop policy if exists "Enable access to all users" on songs;
drop policy if exists "Enable access to all users" on playlists;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Songs are viewable by everyone" on songs;
drop policy if exists "Authenticated can create songs" on songs;
drop policy if exists "Editors can update own songs" on songs;
drop policy if exists "Admins can update all songs" on songs;
drop policy if exists "Admins can delete songs" on songs;
drop policy if exists "Public playlists are viewable by everyone" on playlists;
drop policy if exists "Users can view own playlists" on playlists;
drop policy if exists "Users can insert own playlists" on playlists;
drop policy if exists "Users can update own playlists" on playlists;
drop policy if exists "Users can delete own playlists" on playlists;
drop policy if exists "Items viewable if playlist viewable" on playlist_items;
drop policy if exists "Items editable if playlist editable" on playlist_items;
drop policy if exists "Items updatable if playlist editable" on playlist_items;
drop policy if exists "Items deletable if playlist editable" on playlist_items;

-- RECREATE POLICIES

-- PROFILES
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- SONGS
create policy "Songs are viewable by everyone" on songs for select using (true);
create policy "Authenticated can create songs" on songs for insert with check (auth.role() = 'authenticated');
create policy "Editors can update own songs" on songs for update using (auth.uid() = created_by);
create policy "Admins can update all songs" on songs for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete songs" on songs for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- PLAYLISTS
create policy "Public playlists are viewable by everyone" on playlists for select using (is_public = true);
create policy "Users can view own playlists" on playlists for select using (auth.uid() = owner_id);
create policy "Users can insert own playlists" on playlists for insert with check (auth.uid() = owner_id);
create policy "Users can update own playlists" on playlists for update using (auth.uid() = owner_id);
create policy "Users can delete own playlists" on playlists for delete using (auth.uid() = owner_id);

-- PLAYLIST ITEMS
create policy "Items viewable if playlist viewable" on playlist_items for select using (exists (select 1 from playlists p where p.id = playlist_items.playlist_id and (p.is_public = true or p.owner_id = auth.uid())));
create policy "Items editable if playlist editable" on playlist_items for insert with check (exists (select 1 from playlists p where p.id = playlist_items.playlist_id and p.owner_id = auth.uid()));
create policy "Items updatable if playlist editable" on playlist_items for update using (exists (select 1 from playlists p where p.id = playlist_items.playlist_id and p.owner_id = auth.uid()));
create policy "Items deletable if playlist editable" on playlist_items for delete using (exists (select 1 from playlists p where p.id = playlist_items.playlist_id and p.owner_id = auth.uid()));

-- FUNCTIONS & TRIGGERS
create or replace function public.handle_new_user() returns trigger as $$
declare
  is_admin boolean;
begin
  is_admin := new.email = 'fabiano_fischer@hotmail.com';
  insert into public.profiles (id, email, role) 
  values (new.id, new.email, case when is_admin then 'admin'::user_role else 'musician'::user_role end)
  on conflict (id) do update set role = excluded.role;
  return new;
end;
$$ language plpgsql security definer;

-- If the user already exists, update them now
do $$
begin
  update public.profiles set role = 'admin' where email = 'fabiano_fischer@hotmail.com';
end $$;

-- Drop trigger if exists to avoid duplication error (Postgres doesn't support CREATE OR REPLACE TRIGGER)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
