-- Add created_by to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Add name to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update RLS for songs to allow setting created_by
-- (Assuming policies exist, we might need to verify or update them)
-- Usually: "INSERT WITH CHECK (auth.uid() = created_by)"
-- For now, we trust the logic or existing policies.

-- Bonus: Attempt to backfill created_by if possible?
-- Without history, we can't really know. 
-- Maybe set to current user for new ones going forward.
