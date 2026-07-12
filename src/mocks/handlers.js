import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mock.supabase.co';

export const handlers = [
    // --- AUTH HANDLERS ---
    
    // Mock getSession / User
    http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
        return HttpResponse.json({
            session: {
                user: { id: 'test-user-id', email: 'test@example.com' },
                access_token: 'mock-token',
                expires_in: 3600,
                token_type: 'bearer'
            }
        });
    }),

    // Mock signInWithPassword (The token endpoint)
    http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
        return HttpResponse.json({
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: { 
                id: 'test-user-id', 
                email: 'test@example.com',
                aud: 'authenticated',
                role: 'authenticated',
                email_confirmed_at: new Date().toISOString()
            }
        });
    }),

    // Mock getUser (on load)
    http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
        return HttpResponse.json({
            id: 'test-user-id',
            email: 'test@example.com',
            aud: 'authenticated',
            role: 'authenticated'
        });
    }),

    // Mock logout
    http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // --- DATABASE HANDLERS ---

    // Mock profiles fetch
    http.get(`${SUPABASE_URL}/rest/v1/profiles`, ({ request }) => {
        const url = new URL(request.url);
        
        // Profiles often use .single() which expects an object, not an array
        // but the REST API usually returns an array unless a specific header is sent.
        // MSW should return what the client expects.
        if (request.url.includes('test-user-id')) {
            const data = {
                id: 'test-user-id',
                name: 'Test User',
                role: 'super_admin'
            };
            
            // If the request has 'application/vnd.pgrst.object+json' it wants a single object
            if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
                return HttpResponse.json(data);
            }
            return HttpResponse.json([data]);
        }
        return HttpResponse.json([]);
    }),

    // Mock songs fetch
    http.get(`${SUPABASE_URL}/rest/v1/songs`, () => {
        return HttpResponse.json([
            { id: 'song-1', title: 'Amazing Grace', artist: 'John Newton', content: 'C G Am F', views: 100 },
            { id: 'song-2', title: 'How Great Thou Art', artist: 'Carl Boberg', content: 'G C D G', views: 50 }
        ]);
    }),

    // Mock playlists fetch
    http.get(`${SUPABASE_URL}/rest/v1/playlists`, () => {
        return HttpResponse.json([
            { id: 'playlist-1', name: 'Sunday Worship', owner_id: 'test-user-id' }
        ]);
    }),

    // Mock any other REST call
    http.get(`${SUPABASE_URL}/rest/v1/*`, () => {
        return HttpResponse.json([]);
    }),

    http.post(`${SUPABASE_URL}/rest/v1/*`, () => {
        return HttpResponse.json({ success: true });
    }),
    
    http.patch(`${SUPABASE_URL}/rest/v1/*`, () => {
        return HttpResponse.json({ success: true });
    }),

    http.delete(`${SUPABASE_URL}/rest/v1/*`, () => {
        return HttpResponse.json({ success: true });
    })
];
