-- Query para verificar em quais playlists o Laércio está e qual é o status dele
SELECT 
    pm.id as "ID do Membro",
    p.name as "Nome da Playlist",
    pm.role as "Permissão",
    pm.status as "Status do Convite",
    p.owner_id as "Dono da Playlist",
    pm.created_at as "Adicionado em"
FROM 
    public.playlist_members pm
JOIN 
    public.playlists p ON pm.playlist_id = p.id
JOIN 
    public.profiles pr ON pm.user_id = pr.id
WHERE 
    pr.email = 'laerciovelasque@hotmail.com';
