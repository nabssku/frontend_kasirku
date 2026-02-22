import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../../types';
import { getDefaultPage } from '../../lib/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user) {
        const userRoles = user.roles?.map(r => r.slug as UserRole) || [];
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));

        if (!hasAccess) {
            // Redirect to the user's appropriate landing page instead of /dashboard
            const defaultPage = getDefaultPage(user.roles || []);
            return <Navigate to={defaultPage} replace />;
        }
    }

    return <>{children}</>;
};
