/**
 * Profiles API (MongoDB via Node.js Backend)
 * Handles user profile management
 */

import { api } from '@/lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  userType: string;
  status?: string;
  isOnline?: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get all user profiles (admin only)
 */
export const getAllProfiles = async (): Promise<UserProfile[]> => {
  try {
    const result = await api.get('/profiles');
    return result;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
};

/**
 * Get count of currently online users (admin only – lean, no full payload)
 */
export const getOnlineCount = async (): Promise<{ count: number }> => {
  try {
    const result = await api.get('/profiles/online-count');
    return result;
  } catch (error) {
    console.error('Error fetching online count:', error);
    return { count: 0 };
  }
};
