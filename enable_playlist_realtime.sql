-- Habilita o Realtime para as tabelas de playlist
begin;
  -- Verifica se a publication existe (padrao no Supabase)
  -- Adiciona tabelas a publicação supabase_realtime
  alter publication supabase_realtime add table playlist_items;
  alter publication supabase_realtime add table playlist_comments;
  alter publication supabase_realtime add table playlist_members;
commit;
