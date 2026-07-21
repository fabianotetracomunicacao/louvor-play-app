import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LiquidLoader } from './LiquidLoader';

export function PrivateRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LiquidLoader fullScreen={true} />;
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
