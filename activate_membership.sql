CREATE OR REPLACE FUNCTION public.activate_my_membership()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.church_user_memberships 
    SET status = 'active'
    WHERE user_id = auth.uid() AND status = 'pending';
END;
$$;
