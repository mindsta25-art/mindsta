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
  isVerified?: boolean;
}

export interface SignUpResponse {
  message?: string;
  email?: string;
  requiresVerification?: boolean;
  userId?: string;
  // OR regular AuthUser if no verification needed
  id?: string;
  fullName?: string;
  userType?: string;
  token?: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<SignUpResponse> => {
  try {
    const result = await api.post('/auth/signup', data);
    return result;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Verify email with OTP
 */
export const verifyOTP = async (email: string, otp: string): Promise<{ message: string; user: AuthUser }> => {
  try {
    const result = await api.post('/auth/verify-otp', { email, otp });
    return result;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Resend OTP for email verification
 */
export const resendOTP = async (email: string): Promise<{ message: string }> => {
  try {
    const result = await api.post('/auth/resend-otp', { email });
    return result;
  } catch (error) {
    console.error('Error resending OTP:', error);
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
 * Sign out (call backend to update online status, then clear token)
 */
export const signOut = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Call backend logout endpoint to update online status
    if (token) {
      try {
        await api.post('/auth/logout', { token });
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Error calling logout endpoint:', error);
      }
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Always clear local storage and redirect
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    // Redirect to index page
    window.location.href = '/';
  }
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

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: {
    emailNotifications?: boolean;
    quizReminders?: boolean;
    progressUpdates?: boolean;
    weeklyReport?: boolean;
  }
): Promise<{ success: boolean; message: string; preferences: any }> => {
  try {
    const result = await api.put('/auth/notification-preferences', {
      userId,
      ...preferences
    });
    return result;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Update privacy settings
 */
export const updatePrivacySettings = async (
  userId: string,
  settings: {
    showProgress?: boolean;
    allowAnalytics?: boolean;
  }
): Promise<{ success: boolean; message: string; settings: any }> => {
  try {
    const result = await api.put('/auth/privacy-settings', {
      userId,
      ...settings
    });
    return result;
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    throw error;
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: string): Promise<{
  notificationPreferences: {
    emailNotifications: boolean;
    quizReminders: boolean;
    progressUpdates: boolean;
    weeklyReport: boolean;
  };
  privacySettings: {
    showProgress: boolean;
    allowAnalytics: boolean;
  };
}> => {
  try {
    const result = await api.get(`/auth/preferences/${userId}`);
    return result;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
};
