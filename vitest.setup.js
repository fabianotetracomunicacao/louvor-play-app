import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/mocks/server';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());

// Global mock for import.meta.env
vi.stubGlobal('import.meta', {
    env: {
        VITE_SUPABASE_URL: 'https://mock.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
    }
});
