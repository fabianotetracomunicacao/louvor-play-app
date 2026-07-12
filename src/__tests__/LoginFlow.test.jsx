import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import React from 'react';

// Mock dependencies
vi.mock('../services/AsaasService', () => ({
    AsaasService: {
        createSubscription: vi.fn(),
        getCustomer: vi.fn()
    }
}));

describe('Login Flow', () => {
    it('successfully logs in and redirects to dashboard', async () => {
        const Dashboard = () => <div>Dashboard Page</div>;

        render(
            <MemoryRouter initialEntries={['/login']}>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Routes>
                </AuthProvider>
            </MemoryRouter>
        );

        // Fill login form
        const emailInput = screen.getByPlaceholderText('seu@email.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const loginBtn = screen.getByRole('button', { name: /Entrar/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        fireEvent.click(loginBtn);

        // Wait for navigation to dashboard (mocked success in handlers.js)
        await waitFor(() => {
            expect(screen.getByText('Dashboard Page')).toBeDefined();
        }, { timeout: 10000 });
    });
});
