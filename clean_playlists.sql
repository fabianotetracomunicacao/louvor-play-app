-- CLEANUP PLAYLISTS
-- O usuário optou por criar playlists novas.
-- Vamos limpar qualquer playlist que tenha sido importada para evitar dados "fantasmas".

DELETE FROM public.playlists;
-- Isso vai apagar os itens (playlist_items) automaticamente por causa do ON DELETE CASCADE.

SELECT 'Playlists limpas com sucesso!' as status;
