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
