/**
 * Authentication API (MongoDB via Node.js Backend)
 * Handles user authentication and authorization
 */

import { api } from '@/lib/apiClient';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  userType: 'student' | 'parent' | 'educator' | 'referral';
  grade?: string;
  age?: number;
  schoolName?: string;
  referralCode?: string; // optional: track signup via referral
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AdminSignInData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  userType: string;
  token: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<AuthUser> => {
  try {
    const result = await api.post('/auth/signup', data);
    // Do NOT auto-login on signup. Require user to log in explicitly.
    return result;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign in a user
 */
export const signIn = async (data: SignInData): Promise<AuthUser> => {
  try {
    const result = await api.post('/auth/signin', data);
    
    // Store token and user data
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('currentUser', JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Admin sign in
 */
export const adminSignIn = async (data: AdminSignInData): Promise<AuthUser> => {
  try {
    const result = await api.post('/auth/admin-signin', data);
    
    // Store token and user data
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('currentUser', JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error in admin signin:', error);
    throw error;
  }
};

/**
 * Sign out (client-side - clear token)
 */
export const signOut = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): AuthUser | null => {
  try {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (!user || !token) return null;
    return JSON.parse(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Save auth data to localStorage
 */
export const saveAuthData = (user: AuthUser): void => {
  localStorage.setItem('authToken', user.token);
  localStorage.setItem('currentUser', JSON.stringify(user));
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Check if user is admin (client-side check from stored user data)
 */
export const isAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    return currentUser?.userType === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Change user password
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await api.post('/auth/change-password', {
      userId,
      currentPassword,
      newPassword
    });
    
    return result;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Request password reset link
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await api.post('/auth/forgot-password', { email });
    return result;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

/**
 * Reset password using token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await api.post('/auth/reset-password', { token, newPassword });
    return result;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};
