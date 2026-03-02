/**
 * Format number to Indonesian Rupiah style (e.g., 30.000)
 */
export const formatCurrency = (amount: number | string | undefined): string => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (value === undefined || isNaN(value)) return '0';
    
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

/**
 * Format number to Indonesian Rupiah with Rp prefix
 */
export const formatRp = (amount: number | string | undefined): string => {
    return `Rp ${formatCurrency(amount)}`;
};
