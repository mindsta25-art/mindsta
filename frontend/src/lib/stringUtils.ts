/**
 * String utility functions for consistent text formatting
 */

/**
 * Capitalizes the first letter of each word in a string
 */
export function capitalizeWords(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Capitalizes only the first letter of a string
 */
export function capitalizeFirst(str: string | undefined | null): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format user name to ensure proper capitalization
 */
export function formatUserName(name: string | undefined | null): string {
  if (!name) return '';
  // Handle names that might be all lowercase or all uppercase
  return capitalizeWords(name.trim());
}
