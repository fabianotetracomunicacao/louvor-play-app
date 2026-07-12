-- Migration: Add CifraClub Metadata to Songs
-- Date: 2026-04-02

-- 1. Add 'cifraclub_slug' column to songs table
-- Used for deduplication and as a cache key for external scrapes.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'cifraclub_slug') THEN
        ALTER TABLE public.songs ADD COLUMN cifraclub_slug TEXT;
    END IF;

    -- 2. Add 'is_official' column to songs table
    -- Used to differentiate between user-created and system-managed/reviewed songs.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'is_official') THEN
        ALTER TABLE public.songs ADD COLUMN is_official BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Create index for faster search/deduplication
CREATE INDEX IF NOT EXISTS idx_songs_cifraclub_slug ON public.songs(cifraclub_slug);

-- 4. Enable unique constraint only for non-null values if needed, 
-- but 'cifraclub_slug' might be null for manually added songs.
-- However, we want 'cifraclub_slug' to be unique when it exists to prevent double imports.
-- We handle this via a partial unique index.
DROP INDEX IF EXISTS idx_songs_cifraclub_slug_unique;
CREATE UNIQUE INDEX idx_songs_cifraclub_slug_unique ON public.songs(cifraclub_slug) WHERE (cifraclub_slug IS NOT NULL);
