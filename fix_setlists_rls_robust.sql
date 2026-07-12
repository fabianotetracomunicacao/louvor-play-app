-- Create a secure function to check permissions without RLS recursion issues
CREATE OR REPLACE FUNCTION public.can_manage_playlist(target_playlist_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (postgres/admin)
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.playlists p
    WHERE p.id = target_playlist_id
    AND (
      p.owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 
        FROM public.playlist_members pm
        WHERE pm.playlist_id = p.id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
      )
    )
  );
END;
$$;

-- Apply to SETLISTS
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable write access for playlist owners and editors" ON public.setlists;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.setlists;
DROP POLICY IF EXISTS "Setlists are viewable by everyone" ON public.setlists;
DROP POLICY IF EXISTS "Setlists editable by playlist editors" ON public.setlists;

-- READ: Simple public read for now
CREATE POLICY "Enable read access for all users"
ON public.setlists FOR SELECT
USING (true);

-- WRITE: Use the security definer function
CREATE POLICY "Enable write access for playlist owners and editors"
ON public.setlists FOR ALL
USING ( public.can_manage_playlist(playlist_id) )
WITH CHECK ( public.can_manage_playlist(playlist_id) );


-- Apply to SETLIST_ITEMS
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable write access for playlist owners and editors" ON public.setlist_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.setlist_items;
DROP POLICY IF EXISTS "Setlist items viewable by everyone" ON public.setlist_items;
DROP POLICY IF EXISTS "Setlist items editable by playlist editors" ON public.setlist_items;

-- READ
CREATE POLICY "Enable read access for all users"
ON public.setlist_items FOR SELECT
USING (true);

-- WRITE (via inheritance check)
CREATE POLICY "Enable write access for playlist owners and editors"
ON public.setlist_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.setlists s
    WHERE s.id = setlist_id
    AND public.can_manage_playlist(s.playlist_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.setlists s
    WHERE s.id = setlist_id
    AND public.can_manage_playlist(s.playlist_id)
  )
);
