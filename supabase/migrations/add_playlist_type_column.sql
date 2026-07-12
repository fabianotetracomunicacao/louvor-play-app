-- Adicionar coluna 'type' na tabela de playlists para permitir categorização (ex: Projeção)
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'playlist';

-- Atualizar playlists existentes que tenham 'lyrics' no nome para o tipo 'lyrics_list' (opcional, como heurística)
UPDATE playlists 
SET type = 'lyrics_list' 
WHERE type = 'playlist' AND (name ILIKE '%projeção%' OR name ILIKE '%letras%');
