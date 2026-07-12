import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
    console.log('Starting backup...');

    // 1. Backup Songs
    const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('*');

    if (songsError) {
        console.error('Error fetching songs:', songsError);
    } else {
        fs.writeFileSync('backup_songs_data.json', JSON.stringify(songs, null, 2));
        console.log(`✅ Saved ${songs.length} songs to backup_songs_data.json`);
    }

    // 2. Backup Playlists
    const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select('*');

    if (playlistsError) {
        console.error('Error fetching playlists:', playlistsError);
    } else {
        fs.writeFileSync('backup_playlists_data.json', JSON.stringify(playlists, null, 2));
        console.log(`✅ Saved ${playlists.length} playlists to backup_playlists_data.json`);
    }

    // 3. Backup Playlist Items
    // Note: We need this to reconstruct playlists later
    const { data: playlistItems, error: itemsError } = await supabase
        .from('playlist_items')
        .select('*');

    if (itemsError) {
        // Table might not exist in old version or permission error
        console.warn('Warning: Could not fetch playlist_items (might be legacy structure):', itemsError.message);
    } else {
        fs.writeFileSync('backup_playlist_items_data.json', JSON.stringify(playlistItems, null, 2));
        console.log(`✅ Saved ${playlistItems.length} playlist items to backup_playlist_items_data.json`);
    }

    console.log('Backup finished.');
}

backup();
