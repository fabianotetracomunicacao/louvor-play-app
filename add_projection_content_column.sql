ALTER TABLE public.songs
ADD COLUMN projection_content TEXT DEFAULT NULL;

COMMENT ON COLUMN public.songs.projection_content IS 'Custom lyrics formatting specifically for projection (overrides content for slides if not null)';
