-- Add is_official to songs table
do $$ begin
    alter table songs add column is_official boolean default false;
exception
    when duplicate_column then null;
end $$;

-- Drop function if exists to allow update
drop function if exists toggle_song_official(uuid);

-- Create RPC function to safely toggle official status
create or replace function toggle_song_official(target_song_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  is_admin boolean;
  new_status boolean;
begin
  -- Check if user is authenticated and is admin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select (role = 'admin') into is_admin from profiles where id = auth.uid();
  
  if not is_admin then
    raise exception 'Apenas administradores podem alterar o status oficial.';
  end if;

  -- Toggle status
  update songs 
  set is_official = not coalesce(is_official, false)
  where id = target_song_id
  returning is_official into new_status;

  if not found then
    raise exception 'Song not found';
  end if;

  return new_status;
end;
$$;
