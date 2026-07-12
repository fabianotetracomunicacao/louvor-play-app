-- SQL MIGRATION: ADICIONAR COLUNAS DE OVERRIDE DE PROJEÇÃO
-- Execute este script no SQL Editor do seu Supabase para ativar os ajustes de letra por música na setlist.

-- 1. Atualizar playlist_items
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS projection_content TEXT DEFAULT NULL;
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_bg_type TEXT DEFAULT 'global';
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_bg_url TEXT DEFAULT '';
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_font_size INTEGER DEFAULT 100;

-- 2. Atualizar setlist_items
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS projection_content TEXT DEFAULT NULL;
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_type TEXT DEFAULT 'global';
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_url TEXT DEFAULT '';
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_font_size INTEGER DEFAULT 100;

-- Comentários (Opcional)
COMMENT ON COLUMN public.playlist_items.projection_content IS 'Override de letra da música específico para esta playlist';
COMMENT ON COLUMN public.setlist_items.projection_content IS 'Override de letra da música específico para este culto/setlist';
