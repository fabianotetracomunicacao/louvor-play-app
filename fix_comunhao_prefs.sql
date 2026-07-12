-- Este script remove as preferências Específicas da música "Comunhão" (Kleber Lucas)
-- para o seu usuário.
-- Isso fará com que a música volte a respeitar as configurações globais de Mobile/Desktop.

DELETE FROM user_song_preferences 
WHERE user_id = '75f23839-79b2-49c2-a4f7-928bb320c251' -- Seu ID 
AND song_id = 'e005e245-5c98-4479-ae81-97af481dfc6f'; -- ID da música Comunhão (visto no log)
