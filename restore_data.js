import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restore() {
    console.log('🔄 Starting restoration process...');

    // 1. Get the new Admin ID (Transformation Step)
    // Since we are migrating to a fresh project, the old user UUIDs are dead.
    // We must assign the old data to the NEW user (you).
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
        console.error('❌ Could not find a destination user (Profile). Make sure you have signed up first!', profileError);
        process.exit(1);
    }

    const newOwnerId = profiles[0].id;
    console.log(`👤 Restoring data to user: ${profiles[0].email} (${newOwnerId})`);

    // 2. Restore Songs
    if (fs.existsSync('backup_songs_data.json')) {
        const songsRaw = fs.readFileSync('backup_songs_data.json', 'utf8');
        const songs = JSON.parse(songsRaw).map(song => ({
            ...song,
            created_by: newOwnerId // Re-assign ownership
        }));

        const { error: songsError } = await supabase.from('songs').upsert(songs);
        if (songsError) console.error('❌ Error restoring songs:', songsError);
        else console.log(`✅ Restored ${songs.length} songs.`);
    }

    // 3. Restore Playlists
    if (fs.existsSync('backup_playlists_data.json')) {
        const playlistsRaw = fs.readFileSync('backup_playlists_data.json', 'utf8');
        const playlists = JSON.parse(playlistsRaw).map(playlist => ({
            ...playlist,
            owner_id: newOwnerId // Re-assign ownership
        }));

        const { error: plError } = await supabase.from('playlists').upsert(playlists);
        if (plError) console.error('❌ Error restoring playlists:', plError);
        else console.log(`✅ Restored ${playlists.length} playlists.`);
    }

    // 4. Restore Playlist Items
    // These link songs to playlists. IDs should match since we upserted with original IDs.
    if (fs.existsSync('backup_playlist_items_data.json')) {
        const itemsRaw = fs.readFileSync('backup_playlist_items_data.json', 'utf8');
        const items = JSON.parse(itemsRaw);
        // No owner_id mapping needed here, usually, unless table schema changed.
        // Wait, RLS might require us to be "owner" of the playlist to insert.
        // We are using anon key, so RLS policies apply.
        // 'Authenticated can create songs' -> YES.
        // 'Users can insert own playlists' -> YES.
        // 'Items editable if playlist editable' -> YES (since we own the playlist now).

        // HOWEVER: We are running this script separate from the browser session.
        // The `supabase` client here is NOT logged in as `newOwnerId`. It's anonymous.
        // RLS will likely BLOCK these inserts because auth.uid() is null.

        // TRICK: login as the user first? Or use Service Key?
        // We don't have the user's password.

        // ALTERNATIVE: Use the SERVICE_ROLE KEY if available? 
        // User didn't give us the service key.

        // HACK: Since RLS policies often check `auth.role() = 'authenticated'`,
        // we might fail if we are 'anon'.

        console.warn('⚠️  Warning: Restoring via ANON key might be blocked by RLS if tables are protected.');
        console.warn('    Attempting anyway...');

        // NOTE: If this fails, we will need to temporarily disable RLS or get a Service Key.
        // But let's try.

        const { error: itemsError } = await supabase.from('playlist_items').upsert(items);
        if (itemsError) console.error('❌ Error restoring playlist items:', itemsError);
        else console.log(`✅ Restored ${items.length} playlist items.`);
    }

    console.log('🎉 Restoration attempt finished. Check your app!');
}

restore();
