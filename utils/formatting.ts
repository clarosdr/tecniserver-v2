// utils/formatting.ts

/**
 * Formats a number as Colombian Pesos (COP).
 * Example: 1234567 -> "$ 1.234.567"
 * @param amount The number to format.
 * @returns The formatted currency string.
 */
export const formatCurrencyCOP = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount)) { // Check for null, undefined, or NaN
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
