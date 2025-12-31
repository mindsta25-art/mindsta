/**
 * Currency formatting utilities
 */

import { siteConfig, formatCurrency as configFormatCurrency } from '@/config/siteConfig';

export const formatNaira = (amount: number): string => {
  return configFormatCurrency(amount);
};

export const formatPrice = (amount: number): string => {
  return formatNaira(amount);
};
