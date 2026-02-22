import type { UserRole } from '../types';

/** Determine the default landing page for a user based on their role */
export function getDefaultPage(roles: { slug: string }[] | undefined): string {
    if (!roles) return '/dashboard';
    
    const slugs = roles.map((r) => r.slug as UserRole);
    
    if (slugs.includes('super_admin')) {
        return '/super-admin';
    }
    
    // Kitchen only (no owner/admin override)
    if (slugs.includes('kitchen') && !slugs.includes('owner') && !slugs.includes('admin')) {
        return '/kitchen';
    }
    
    // Cashier only (no owner/admin override)
    if (slugs.includes('cashier') && !slugs.includes('owner') && !slugs.includes('admin')) {
        return '/pos';
    }
    
    return '/dashboard';
}
