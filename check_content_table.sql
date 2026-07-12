-- CHECK CONTENT (Returns a visible Table Result)
-- Finds user by email and shows counts of Songs and Playlists

SELECT 
    u.email, 
    u.id as user_id,
    (SELECT count(*) FROM public.songs s WHERE s.created_by = u.id) as "Músicas Criadas",
    (SELECT count(*) FROM public.playlists p WHERE p.owner_id = u.id) as "Playlists (Dono)"
FROM 
    auth.users u
WHERE 
    u.email = 'fabiano@tetracomuncacao.com.br'
    OR u.email = 'fabiano@tetracomunicacao.com.br'; -- Handling typo just in case

-- If this returns an empty result, the user is completely gone from Auth.
-- If it returns a row, verify the counts.
