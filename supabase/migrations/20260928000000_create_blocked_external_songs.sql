-- Migration: Tabela para registrar cifras externas com problemas estruturais / bloqueadas
-- Permite que o sistema LouvorPlay oculte permanentemente cifras inválidas ou com erro de extração nas buscas

CREATE TABLE IF NOT EXISTS public.blocked_external_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    artist_slug TEXT,
    song_slug TEXT,
    song_name TEXT,
    artist_name TEXT,
    reason TEXT DEFAULT 'problemas_estruturais',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscas rápidas pelo slug
CREATE INDEX IF NOT EXISTS idx_blocked_external_songs_slug ON public.blocked_external_songs(slug);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.blocked_external_songs ENABLE ROW LEVEL SECURITY;

-- Política de leitura: qualquer usuário (autenticado ou anônimo) pode consultar
DROP POLICY IF EXISTS "Permitir leitura de músicas bloqueadas para todos" ON public.blocked_external_songs;
CREATE POLICY "Permitir leitura de músicas bloqueadas para todos"
ON public.blocked_external_songs FOR SELECT
USING (true);

-- Política de inserção: permitir cadastrar novas cifras com problemas
DROP POLICY IF EXISTS "Permitir inserção de músicas bloqueadas para todos" ON public.blocked_external_songs;
CREATE POLICY "Permitir inserção de músicas bloqueadas para todos"
ON public.blocked_external_songs FOR INSERT
WITH CHECK (true);

-- Política de atualização: permitir atualizar registro se necessário
DROP POLICY IF EXISTS "Permitir atualização de músicas bloqueadas para todos" ON public.blocked_external_songs;
CREATE POLICY "Permitir atualização de músicas bloqueadas para todos"
ON public.blocked_external_songs FOR UPDATE
USING (true);
