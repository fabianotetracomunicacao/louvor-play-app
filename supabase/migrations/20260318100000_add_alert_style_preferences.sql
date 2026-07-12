-- Adiciona colunas para preferências de estilo do alerta
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS alert_default_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS alert_default_text_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS alert_default_font_size INTEGER DEFAULT 100;
