-- Add original_song_id to songs table to track copies
do $$ begin
    alter table songs add column original_song_id uuid references songs(id);
exception
    when duplicate_column then null;
end $$;

-- Drop function if exists to allow update
drop function if exists copy_song(uuid);

-- Create RPC function to safely copy a song
create or replace function copy_song(source_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  new_song_id uuid;
  source_song songs%rowtype;
begin
  -- Check if user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Get source song
  select * into source_song from songs where id = source_id;

  if not found then
    raise exception 'Song not found';
  end if;

  -- Check if source is already a copy
  if source_song.original_song_id is not null then
    raise exception 'Cannot copy a song that is already a copy';
  end if;

  -- Insert new song
  insert into songs (
    title,
    artist,
    content,
    original_key,
    font_size,
    line_spacing,
    created_by,
    original_song_id
  ) values (
    source_song.title,
    source_song.artist,
    source_song.content,
    source_song.original_key,
    source_song.font_size,
    source_song.line_spacing,
    auth.uid(),
    source_id
  ) returning id into new_song_id;

  return new_song_id;
end;
$$;
