-- Add is_auto_speed to user_song_preferences
do $$ begin
    alter table user_song_preferences add column is_auto_speed boolean default false;
exception
    when undefined_table then null; -- Handle if table doesn't differ from schema or created differently
    when duplicate_column then null;
end $$;

-- Verify songs table has duration (already done, but good to be safe)
-- (No action needed, previous migration handled it)
