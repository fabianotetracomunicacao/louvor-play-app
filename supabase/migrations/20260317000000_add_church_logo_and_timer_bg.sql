-- Adiciona colunas para Logo da Igreja e Fundo de Timer
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS church_logo_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS timer_default_bg_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS timer_default_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS timer_default_bg_color TEXT DEFAULT '#000000';
