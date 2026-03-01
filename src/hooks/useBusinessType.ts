import { useOutlets } from './useOutlets';
import { useAuthStore } from '../app/store/useAuthStore';

/**
 * Reads business_type from the first active outlet.
 * Components use isFnb / isRetail to conditionally show/hide features.
 */
export function useBusinessType() {
    const { user } = useAuthStore();
    const { data: outlets = [] } = useOutlets();

    // Prioritize user's assigned outlet (for staff), then active, then first
    const activeOutlet = user?.outlet ?? outlets.find((o: any) => o.is_active) ?? outlets[0] ?? null;
    const businessType: 'fnb' | 'retail' = activeOutlet?.business_type ?? 'fnb';

    return {
        businessType,
        isFnb: businessType === 'fnb',
        isRetail: businessType === 'retail',
        outlet: activeOutlet,
    };
}
