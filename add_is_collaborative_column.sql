-- Add is_collaborative column to playlists
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT FALSE;

-- Update RLS to ensure functionality remains (if needed, usually owner/public/member policies cover it)
-- Existing policies cover owner access and member access. 
-- Adding a column doesn't break them unless we want specific rules for collaborative playlists not covered by membership.
-- For now, membership logic + owner logic is sufficient. is_collaborative is just metadata for the owner's view.
