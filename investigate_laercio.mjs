import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigate() {
    console.log("=== Investigating Laercio ===");

    // 1. Fetch profiles
    console.log("1. Finding profile...");
    const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%laercio%');

    if (profileErr) {
        console.error("Error fetching profiles:", profileErr);
        // Let's try grabbing ANY profile to see the schema if this failed
        const { data: anyProfiles } = await supabase.from('profiles').select('*').limit(1);
        console.log("Schema might not have full_name. Sample profile:", anyProfiles);
    } else {
        console.log("Matching Profiles:", profiles);
    }

    // If we found him, check his playlists and memberships
    if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        console.log(`\n2. Checking memberships for user ${userId}...`);

        const { data: members, error: memErr } = await supabase
            .from('playlist_members')
            .select('*, playlists(*)')
            .eq('user_id', userId);

        if (memErr) {
            console.error("Error fetching memberships:", memErr);
        } else {
            console.log("Memberships:", JSON.stringify(members, null, 2));
        }

        console.log(`\n3. Checking what playlists this user can see currently (Simulating User)`);
        // Wait, the anon key won't be able to simulate RLS for this user without logging in.
        // Let's just check the playlists table directly for any playlists he is a member of.
        if (members && members.length > 0) {
            for (const m of members) {
                console.log(`Checking RLS impact on playlist ${m.playlist_id}...`);
                const { data: p, error: pErr } = await supabase
                    .from('playlists')
                    .select('*')
                    .eq('id', m.playlist_id)
                    .single(); // With anon key, this might return nothing if it's protected and not public
                console.log(`Select Playlist as Anon:`, p, pErr ? pErr.message : '');
            }
        }
    } else {
        console.log("Could not find Laercio by full_name. We might need a Service Role key or email search isn't public.");
        // Try checking if we can see any recent profiles
        const { data: recent } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(3);
        console.log("Most recent 3 profiles created:", recent);
    }
}

investigate();
