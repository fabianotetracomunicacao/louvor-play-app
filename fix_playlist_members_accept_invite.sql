-- Fix to allow invited users to accept their collaboration invites.
-- Currently, the 'manage_members' policy only allows the playlist OWNER to update memberships.
-- When a user clicks "Accept Invite", the app tries to update their status to 'active',
-- but it fails because they are not the owner of the playlist.

-- 1. Allow users to update their own membership (e.g. status from 'pending' to 'active')
CREATE POLICY "update_own_membership" ON public.playlist_members
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- 2. Allow users to delete their own membership (reject invite or leave playlist)
CREATE POLICY "delete_own_membership" ON public.playlist_members
  FOR DELETE USING (
    user_id = auth.uid()
  );
