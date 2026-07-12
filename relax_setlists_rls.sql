-- TEMPORARILY RELAX PERMISSIONS FOR TESTING
-- This allows any logged-in user to create/edit setlists
-- We will restore strict security later

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to clear the slate
DROP POLICY IF EXISTS "Enable write access for playlist owners and editors" ON public.setlists;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.setlists;
DROP POLICY IF EXISTS "Setlists are viewable by everyone" ON public.setlists;
DROP POLICY IF EXISTS "Setlists editable by playlist editors" ON public.setlists;

DROP POLICY IF EXISTS "Enable write access for playlist owners and editors" ON public.setlist_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.setlist_items;

-- 1. SETLISTS
-- Read: Everyone
CREATE POLICY "Allow All Read" ON public.setlists FOR SELECT USING (true);
-- Write: Any Authenticated User (Temporary Fix)
CREATE POLICY "Allow Authenticated Write" ON public.setlists FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- 2. SETLIST ITEMS
-- Read: Everyone
CREATE POLICY "Allow All Read Items" ON public.setlist_items FOR SELECT USING (true);
-- Write: Any Authenticated User (Temporary Fix)
CREATE POLICY "Allow Authenticated Write Items" ON public.setlist_items FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');
