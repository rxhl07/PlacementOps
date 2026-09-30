import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/domain';

export const ProtectedRoute: React.FC = () => {
    const { token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-background flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500 font-medium text-xs">
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    Authenticating session...
                </div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export const RoleGuard: React.FC<{ allowedRoles: Role[] }> = ({ allowedRoles }) => {
    const { user, hasRole } = useAuth();

    if (!user || !hasRole(...allowedRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};