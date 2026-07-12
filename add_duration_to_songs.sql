-- Add duration column to songs table
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'duration') then
        alter table songs add column duration integer default 0;
    end if;
end $$;
