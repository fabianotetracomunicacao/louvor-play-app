import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

// Helper component to test auth state
const AuthTestComponent = () => {
    const { user, loading, role, login, logout } = useAuth();
    
    if (loading) return <div>Loading Auth...</div>;
    
    return (
        <div>
            <div data-testid="user-email">{user?.email || 'no-email'}</div>
            <div data-testid="user-role">{role || 'no-role'}</div>
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    it('provides user data and role after successful login', async () => {
        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        // Wait for potential initial session check to finish
        await waitFor(() => {
            expect(screen.queryByText(/Loading Auth.../i)).toBeNull();
        }, { timeout: 5000 });

        // Trigger manual login to ensure we have a session
        const loginBtn = screen.getByText('Login');
        await act(async () => {
            fireEvent.click(loginBtn);
        });

        // Check if state updated
        await waitFor(() => {
            expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
            expect(screen.getByTestId('user-role').textContent).toBe('super_admin');
        }, { timeout: 10000 });
    });

    it('clears session on logout', async () => {
        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        await waitFor(() => expect(screen.queryByText(/Loading Auth.../i)).toBeNull());

        // Login first
        const loginBtn = screen.getByText('Login');
        await act(async () => {
            fireEvent.click(loginBtn);
        });

        await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe('test@example.com'));

        const logoutButton = screen.getByText('Logout');
        await act(async () => {
            fireEvent.click(logoutButton);
        });

        await waitFor(() => {
            expect(screen.getByTestId('user-email').textContent).toBe('no-email');
            expect(screen.getByTestId('user-role').textContent).toBe('no-role');
        });
    });
});
