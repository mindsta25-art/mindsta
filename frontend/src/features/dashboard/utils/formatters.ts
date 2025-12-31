/**
 * Text and data formatting utilities
 */

/**
 * Format time difference as human-readable string
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date().getTime();
  const diff = Math.max(0, now - date.getTime());
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

/**
 * Format student name for display (capitalize first word)
 */
export const formatStudentName = (fullName?: string): string => {
  if (!fullName) return 'Student';
  
  const firstName = fullName.split(' ')[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Create URL-friendly slug from text
 */
export const createSlug = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, '-');
};
