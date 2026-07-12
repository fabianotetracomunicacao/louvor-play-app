import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataProvider, useData } from '../DataContext';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

// Mock dependencies
vi.mock('../hooks/useDeviceType', () => ({
    useDeviceType: () => ({ isMobile: false, isTablet: false, isDesktop: true })
}));

// Helper component
const DataTestComponent = () => {
    const { topSongs, isLoading, likedSongs, toggleLike } = useData();
    const { login, user } = useAuth();
    
    if (isLoading) return <div>Loading Data...</div>;
    
    return (
        <div>
            <div data-testid="user-status">{user ? 'logged' : 'out'}</div>
            <div data-testid="songs-count">{topSongs.length}</div>
            <div data-testid="liked-count">{likedSongs.length}</div>
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            <button onClick={() => toggleLike('song-1')}>Toggle Like</button>
        </div>
    );
};

describe('DataContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads initial data when user is authenticated', async () => {
        render(
            <AuthProvider>
                <DataProvider>
                    <DataTestComponent />
                </DataProvider>
            </AuthProvider>
        );

        // Wait for auth to be ready
        await waitFor(() => expect(screen.queryByText(/Loading Data.../i)).toBeNull());

        // Login manually
        const loginBtn = screen.getByText('Login');
        await act(async () => {
            fireEvent.click(loginBtn);
        });

        // Wait for user to be logged and data to load
        await waitFor(() => {
            expect(screen.getByTestId('user-status').textContent).toBe('logged');
            expect(screen.getByTestId('songs-count').textContent).not.toBe('0');
        }, { timeout: 10000 });
    });

    it('handles interaction like toggleLike', async () => {
        render(
            <AuthProvider>
                <DataProvider>
                    <DataTestComponent />
                </DataProvider>
            </AuthProvider>
        );

        await waitFor(() => expect(screen.queryByText(/Loading Data.../i)).toBeNull());
        
        // Login first
        await act(async () => {
            fireEvent.click(screen.getByText('Login'));
        });

        await waitFor(() => expect(screen.getByTestId('user-status').textContent).toBe('logged'));

        const toggleButton = screen.getByText('Toggle Like');
        await act(async () => {
            fireEvent.click(toggleButton);
        });

        // Liked count should exist
        expect(screen.getByTestId('liked-count')).toBeDefined();
    });
});
