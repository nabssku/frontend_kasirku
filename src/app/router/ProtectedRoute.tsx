import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole, PlanFeature } from '../../types';
import { getDefaultPage } from '../../lib/auth';
import { useCurrentSubscription } from '../../hooks/useSubscription';
import { PremiumFeatureLock } from '../../components/shared/PremiumFeatureLock';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    requiredFeature?: string;
    featureName?: string;
}

export const ProtectedRoute = ({
    children,
    allowedRoles,
    requiredFeature,
    featureName = 'Fitur ini'
}: ProtectedRouteProps) => {
    const { isAuthenticated, user, isInitializing } = useAuthStore();
    const location = useLocation();
    const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCurrentSubscription();

    // While verifying auth status, don't redirect yet
    if (isInitializing || (isAuthenticated && isSubscriptionLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role Check
    if (allowedRoles && user) {
        const userRoles = user.roles?.map(r => r.slug as UserRole) || [];
        const isSuperAdmin = userRoles.includes('super_admin');
        const hasRoleAccess = allowedRoles.some(role => userRoles.includes(role));

        if (!hasRoleAccess && !isSuperAdmin) {
            const defaultPage = getDefaultPage(user.roles || []);
            return <Navigate to={defaultPage} replace />;
        }
    }

    // Feature Check (Plan-based)
    if (requiredFeature && user) {
        const userRoles = user.roles?.map(r => r.slug as UserRole) || [];
        const isSuperAdmin = userRoles.includes('super_admin');

        // Super Admin bypasses feature checks
        if (!isSuperAdmin) {
            const features = subscriptionData?.subscription?.plan?.features || [];
            const hasFeature = features.some((f: PlanFeature) =>
                f.feature_key === requiredFeature && f.feature_value === 'true'
            );

            if (!hasFeature) {
                return <PremiumFeatureLock featureName={featureName} />;
            }
        }
    }

    return <>{children}</>;
};
