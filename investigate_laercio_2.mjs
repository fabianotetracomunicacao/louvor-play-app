import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We need the service role key to bypass RLS and see everything. 
// But let's try with Anon key first. If memberships need auth to see, it will fail.
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigate() {
    const userId = 'efdf71af-07df-40dd-ae36-d1c852e3bb03'; // Laercio
    console.log(`=== Investigating Memberships for user ${userId} ===`);

    // 1. Fetch memberships (bypassing RLS requires service key, but let's see if public can see memberships or if we just select them)
    // Actually, anon key cannot read playlist_members if it's protected.
    // We can try to authenticate as Laercio, or we can use a SQL script via psql or similar.
    // Let's see what anon can see.
    const { data: members, error: memErr } = await supabase
        .from('playlist_members')
        .select('*, playlists(*)')
        .eq('user_id', userId);

    if (memErr) {
        console.error("Error fetching memberships (RLS issue?):", memErr);
    } else {
        console.log(`Found ${members?.length || 0} memberships for Laercio:`);
        console.log(JSON.stringify(members, null, 2));
    }
}

investigate();
