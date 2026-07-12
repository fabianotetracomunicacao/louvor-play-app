-- NOTIFICATION SYSTEM & PLAYLIST INVITES SCHEMA
-- Run this in Supabase SQL Editor

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('invite', 'song_added', 'message', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb, -- Stores playlistId, inviteId, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/update their own notifications
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Allow inserting notifications (server-side function or open insert? 
-- Open insert for 'authenticated' allows P2P notifications, which is what we need for now unless using Edge Functions)
-- We will allow authenticated users to insert notifications for OTHERS (e.g. inviting them).
CREATE POLICY "Users can insert notifications" 
ON notifications FOR INSERT 
TO authenticated 
WITH CHECK (true); 
-- Note: 'true' is broad, but necessary for P2P invites without backend. Ideally we'd restrict 'type' via Trigger.

-- 2. Update Playlist Members Table
-- Add status column (default 'active' so existing members don't break)
ALTER TABLE playlist_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending'));

-- Update RLS for playlist_members (if needed) to allow owners to insert 'pending' members?
-- The previous 'fix_rls_v2.sql' allowed users to insert THEMSELVES.
-- Now we need owners/editors to insert OTHERS as 'pending'.

-- DROP old policy regarding "Allow users to follow public playlists" if it conflicts?
-- No, that one was for "user_id = auth.uid()".
-- We need a NEW policy: "Allow owners to invite users"
CREATE POLICY "Allow collaborative invites" 
ON playlist_members 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- 1. I am modifying my own playlist (owner) OR I am in the playlist?
  -- Actually, usually only Owners invite.
  EXISTS (
    SELECT 1 FROM playlists 
    WHERE id = playlist_id AND owner_id = auth.uid()
  )
  AND status = 'pending' -- Can only insert as pending!
);

-- Additional Trigger to auto-create Notification on Invite?
-- Let's handle it in Frontend for flexibility first, or SQL trigger?
-- Frontend is easier to implement "Toast" + DB Insert together.
