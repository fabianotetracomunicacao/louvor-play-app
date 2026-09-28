import { beforeEach, describe, expect, it, vi } from 'vitest';

const { upsert, select, update, ilike, supabase } = vi.hoisted(() => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const select = vi.fn().mockResolvedValue({
        data: [{ slug: 'aline-barros/consagracao' }],
        error: null,
    });
    const ilike = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ ilike }));

    return {
        upsert,
        select,
        update,
        ilike,
        supabase: {
            from: vi.fn((table) => {
                if (table === 'blocked_external_songs') {
                    return { select, upsert };
                }
                if (table === 'songs') {
                    return { update };
                }
                return {};
            }),
        },
    };
});

vi.mock('../../supabaseClient', () => ({ supabase }));

import {
    getBlockedExternalSlugs,
    recordBlockedExternalSong,
    filterBlockedExternalSongs,
    isExternalSlugBlockedSync,
} from '../blockedSongs';

describe('blockedSongs utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('retrieves blocked slugs and combines with Supabase', async () => {
        const slugs = await getBlockedExternalSlugs();
        expect(slugs.has('aline-barros/consagracao')).toBe(true);
    });

    it('records a new blocked external song and updates localStorage & Supabase', async () => {
        await recordBlockedExternalSong({
            slug: 'banda-resgate/consciencia',
            artist_slug: 'banda-resgate',
            song_slug: 'consciencia',
            name: 'Consciência',
            artist: 'Resgate',
            reason: 'problemas_estruturais'
        });

        expect(upsert).toHaveBeenCalledWith([
            expect.objectContaining({
                slug: 'banda-resgate/consciencia',
                song_name: 'Consciência',
                artist_name: 'Resgate',
                reason: 'problemas_estruturais',
            })
        ], { onConflict: 'slug' });

        expect(update).toHaveBeenCalledWith(expect.objectContaining({
            deleted_at: expect.any(String)
        }));
        expect(ilike).toHaveBeenCalledWith('cifraclub_slug', 'banda-resgate/consciencia');

        const slugs = await getBlockedExternalSlugs();
        expect(slugs.has('banda-resgate/consciencia')).toBe(true);
    });

    it('filters out blocked songs from external search results', async () => {
        const results = [
            { name: 'Consagração', artist: 'Aline Barros', slug: 'aline-barros/consagracao' },
            { name: 'Ressuscita-me', artist: 'Aline Barros', slug: 'aline-barros/ressuscita-me' }
        ];

        const filtered = await filterBlockedExternalSongs(results);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].slug).toBe('aline-barros/ressuscita-me');
    });

    it('checks synchronous blocked state from cache', () => {
        expect(isExternalSlugBlockedSync('aline-barros/consagracao')).toBe(true);
        expect(isExternalSlugBlockedSync('unknown/slug')).toBe(false);
    });
});
