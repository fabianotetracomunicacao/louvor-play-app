-- Migration: Create instrument metadata and update profiles
-- Date: 2026-03-20

-- 1. Create instrument_metadata table
CREATE TABLE IF NOT EXISTS public.instrument_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'instrument', -- 'instrument', 'vocal', 'role'
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add available_instruments to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS available_instruments JSONB DEFAULT '[]'::jsonb;

-- 3. Initial Data (Optional defaults)
INSERT INTO public.instrument_metadata (name, type, icon)
VALUES 
    ('Violão', 'instrument', 'music'),
    ('Guitarra', 'instrument', 'music'),
    ('Teclado', 'instrument', 'music'),
    ('Baixo', 'instrument', 'music'),
    ('Bateria', 'instrument', 'drum'),
    ('Vocal', 'vocal', 'mic'),
    ('Backing Vocal', 'vocal', 'mic'),
    ('Projeção', 'role', 'monitor'),
    ('Som', 'role', 'volume-2')
ON CONFLICT (name) DO NOTHING;

-- 4. RLS for instrument_metadata
ALTER TABLE public.instrument_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all authenticated users" 
ON public.instrument_metadata FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for admins" 
ON public.instrument_metadata FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Note: Ensure updated profiles can be read by others if needed for scales
-- Existing profiles RLS usually allows this.
