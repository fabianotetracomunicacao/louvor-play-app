COPY (SELECT json_agg(t) FROM (SELECT * FROM public.songs) t) TO 'C:\Users\Administrator\Desktop\Aplicativo cifras Tetracom\backup_songs.json';
COPY (SELECT json_agg(t) FROM (SELECT * FROM public.playlists) t) TO 'C:\Users\Administrator\Desktop\Aplicativo cifras Tetracom\backup_playlists.json';
