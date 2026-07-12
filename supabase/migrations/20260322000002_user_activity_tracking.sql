-- Table to track user activities (logins, projections, etc.)
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'login', 'projection', 'song_view', etc.
    target_id UUID, -- ID of the song, setlist, etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster reporting
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_event_type ON public.user_activity_logs(event_type);

-- RPC to get a consolidated activity report for a user
CREATE OR REPLACE FUNCTION public.get_user_activity_report(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    songs_created_count BIGINT;
    songs_viewed_count BIGINT;
    login_count BIGINT;
    projection_count BIGINT;
    playlists_owned_count BIGINT;
    playlists_member_count BIGINT;
    result JSONB;
BEGIN
    -- 1. Songs Created
    SELECT COUNT(*) INTO songs_created_count 
    FROM public.songs 
    WHERE created_by = target_user_id AND deleted_at IS NULL;

    -- 2. Songs Viewed (from history)
    SELECT COUNT(*) INTO songs_viewed_count 
    FROM public.user_history 
    WHERE user_id = target_user_id;

    -- 3. Logins
    SELECT COUNT(*) INTO login_count 
    FROM public.user_activity_logs 
    WHERE user_id = target_user_id AND event_type = 'login';

    -- 4. Projections
    SELECT COUNT(*) INTO projection_count 
    FROM public.user_activity_logs 
    WHERE user_id = target_user_id AND event_type = 'projection';

    -- 5. Playlists (Owned)
    SELECT COUNT(*) INTO playlists_owned_count 
    FROM public.playlists 
    WHERE owner_id = target_user_id;

    -- 6. Playlists (Member)
    SELECT COUNT(*) INTO playlists_member_count 
    FROM public.playlist_members 
    WHERE user_id = target_user_id AND status = 'active';

    -- Construct Result
    result := jsonb_build_object(
        'songs_created', songs_created_count,
        'songs_viewed', songs_viewed_count,
        'logins', login_count,
        'projections', projection_count,
        'playlists_owned', playlists_owned_count,
        'playlists_member', playlists_member_count,
        'total_playlists', playlists_owned_count + playlists_member_count
    );

    RETURN result;
END;
$$;
