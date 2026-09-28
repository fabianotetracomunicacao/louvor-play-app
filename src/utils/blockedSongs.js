import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'lp_blocked_external_slugs';

// In-memory cache of blocked slugs (lowercase)
let memoryBlockedSlugs = null;
let fetchPromise = null;

function getStoredSlugs() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const arr = JSON.parse(stored);
            return new Set(Array.isArray(arr) ? arr.map(s => String(s).toLowerCase().trim()) : []);
        }
    } catch (e) {
        console.warn('Error reading blocked slugs from localStorage:', e);
    }
    return new Set();
}

function saveStoredSlugs(slugSet) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(slugSet)));
    } catch (e) {
        console.warn('Error saving blocked slugs to localStorage:', e);
    }
}

/**
 * Returns a Set of blocked external song slugs (in lowercase).
 * Merges localStorage cache and Supabase table `blocked_external_songs`.
 */
export async function getBlockedExternalSlugs() {
    if (memoryBlockedSlugs !== null) {
        return memoryBlockedSlugs;
    }

    if (fetchPromise) {
        return fetchPromise;
    }

    fetchPromise = (async () => {
        const slugs = getStoredSlugs();

        try {
            const { data, error } = await supabase
                .from('blocked_external_songs')
                .select('slug');

            if (!error && Array.isArray(data)) {
                data.forEach(item => {
                    if (item.slug) slugs.add(item.slug.toLowerCase().trim());
                });
                saveStoredSlugs(slugs);
            }
        } catch (err) {
            console.warn('Could not fetch blocked_external_songs from Supabase, using local cache:', err);
        }

        memoryBlockedSlugs = slugs;
        fetchPromise = null;
        return memoryBlockedSlugs;
    })();

    return fetchPromise;
}

/**
 * Synchronous check against local memory/localStorage cache.
 */
export function isExternalSlugBlockedSync(slug) {
    if (!slug) return false;
    const cleanSlug = String(slug).toLowerCase().trim();
    if (memoryBlockedSlugs) {
        return memoryBlockedSlugs.has(cleanSlug);
    }
    const stored = getStoredSlugs();
    return stored.has(cleanSlug);
}

/**
 * Registers an external song as blocked / with structural problems.
 * - Stores in memory + localStorage
 * - Upserts into Supabase `blocked_external_songs`
 * - Soft-deletes any matching song in `songs` table if it exists
 */
export async function recordBlockedExternalSong({ slug, artist_slug, song_slug, name, artist, reason = 'problemas_estruturais' }) {
    const rawSlug = slug || (artist_slug && song_slug ? `${artist_slug}/${song_slug}` : null);
    if (!rawSlug) return;

    const cleanSlug = String(rawSlug).toLowerCase().trim();

    // 1. Update memory and localStorage immediately
    if (!memoryBlockedSlugs) {
        memoryBlockedSlugs = getStoredSlugs();
    }
    memoryBlockedSlugs.add(cleanSlug);
    saveStoredSlugs(memoryBlockedSlugs);

    // 2. Persist to Supabase `blocked_external_songs`
    try {
        const payload = {
            slug: cleanSlug,
            artist_slug: artist_slug || cleanSlug.split('/')[0] || null,
            song_slug: song_slug || cleanSlug.split('/')[1] || null,
            song_name: name || null,
            artist_name: artist || null,
            reason: reason,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('blocked_external_songs')
            .upsert([payload], { onConflict: 'slug' });

        if (error) {
            console.warn('Warning: Could not save to blocked_external_songs in Supabase:', error.message);
        }
    } catch (err) {
        console.warn('Error saving to blocked_external_songs table:', err);
    }

    // 3. Delete from `songs` table if any song already had this cifraclub_slug
    try {
        await supabase
            .from('songs')
            .update({ deleted_at: new Date().toISOString() })
            .ilike('cifraclub_slug', cleanSlug);
    } catch (err) {
        console.warn('Error soft-deleting song with cifraclub_slug:', err);
    }
}

/**
 * Helper to filter out blocked items from an array of external search results.
 */
export async function filterBlockedExternalSongs(results) {
    if (!Array.isArray(results) || results.length === 0) return [];
    try {
        const blockedSet = await getBlockedExternalSlugs();
        return results.filter(item => {
            const slug = (item.slug || `${item.artist_slug}/${item.song_slug}` || '').toLowerCase().trim();
            return !blockedSet.has(slug);
        });
    } catch (e) {
        console.warn('Error filtering blocked songs:', e);
        return results;
    }
}
