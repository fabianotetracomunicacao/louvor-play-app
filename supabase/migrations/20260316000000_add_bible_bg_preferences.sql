-- Adiciona colunas para preferência de fundo exclusivo para Bíblia
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS bible_default_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS bible_default_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS bible_default_bg_url TEXT DEFAULT '';
