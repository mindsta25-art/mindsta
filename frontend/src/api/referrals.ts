/**
 * Referrals API (MongoDB via Node.js Backend)
 * Handles referral system operations
 */

import { api } from '@/lib/apiClient';

export interface Referral {
  id: string;
  referrerId: string;
  referrerEmail?: string;
  referrerName?: string;
  referrerType?: string;
  referredEmail: string;
  referredUserId?: string;
  referredUserName?: string;
  referredUserType?: string;
  referredUserStatus?: string;
  status: 'pending' | 'completed' | 'expired';
  rewardAmount: number;
  rewardClaimed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  expiredReferrals: number;
  totalRewards: number;
  claimedRewards: number;
  unclaimedRewards: number;
  topReferrers: Array<{
    referrerId: string;
    referrerEmail: string;
    referrerName: string;
    totalReferrals: number;
    completedReferrals: number;
    totalRewards: number;
  }>;
}

export interface ReferralSettings {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  commissionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidOutEarnings: number;
  updatedAt: string;
}

export interface ReferralTransactionItem {
  id: string;
  referralId?: string;
  userId: string;
  studentId?: string;
  paymentId?: string;
  amountPaid: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  createdAt: string;
}

export interface ReferralDashboard {
  referralCode: string;
  fullName: string;
  email: string;
  referralLink: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidOutEarnings: number;
  commissionRate: number;
  hasBankDetails: boolean;
  recentReferrals: Array<{
    id: string;
    referredEmail: string;
    referredUserName: string;
    referredUserId?: string;
    status: string;
    rewardAmount: number;
    createdAt: string;
    registeredAt?: string;
  }>;
  recentTransactions: Array<{
    id: string;
    studentName: string;
    studentEmail?: string;
    amountPaid: number;
    commissionAmount: number;
    status: string;
    paymentReference?: string;
    createdAt: string;
    paidAt?: string;
  }>;
}

export interface AdminReferralOverview {
  totals: {
    totalReferrers: number;
    totalReferrals: number;
    totalEarnings: number;
    totalPendingEarnings: number;
    totalPaidOut: number;
    referrersWithBankDetails: number;
  };
  referrers: Array<{
    userId: string;
    email: string;
    fullName: string;
    referralCode: string;
    status: string;
    joinedAt: string;
    hasBankDetails: boolean;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
    commissionRate: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidOutEarnings: number;
    pendingTransactions: number;
  }>;
}

/**
 * Get all referrals (Admin only)
 */
export const getAllReferrals = async (): Promise<Referral[]> => {
  try {
    const result = await api.get('/referrals');
    return result;
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
};

/**
 * Get referrals by user ID
 */
export const getReferralsByUserId = async (userId: string): Promise<Referral[]> => {
  try {
    const result = await api.get(`/referrals/user/${userId}`);
    return result;
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    return [];
  }
};

/**
 * Get referral statistics (Admin only)
 */
export const getReferralStats = async (): Promise<ReferralStats | null> => {
  try {
    const result = await api.get('/referrals/stats');
    return result;
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return null;
  }
};

/**
 * Create a new referral
 */
export const createReferral = async (referrerId: string, referredEmail: string): Promise<Referral> => {
  try {
    const result = await api.post('/referrals', { referrerId, referredEmail });
    return result;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

/**
 * Update referral (Admin only)
 */
export const updateReferral = async (
  id: string, 
  updates: Partial<Pick<Referral, 'status' | 'rewardAmount' | 'rewardClaimed' | 'referredUserId'>>
): Promise<Referral> => {
  try {
    const result = await api.patch(`/referrals/${id}`, updates);
    return result;
  } catch (error) {
    console.error('Error updating referral:', error);
    throw error;
  }
};

/**
 * Delete referral (Admin only)
 */
export const deleteReferral = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/referrals/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting referral:', error);
    return false;
  }
};

// Referral settings
export const getMyReferralSettings = async (): Promise<ReferralSettings> => {
  return api.get('/referrals/me/settings');
};

export const updateMyReferralSettings = async (updates: Partial<ReferralSettings>): Promise<ReferralSettings> => {
  return api.put('/referrals/me/settings', updates);
};

// Referral transactions
export const getMyReferralTransactions = async (): Promise<ReferralTransactionItem[]> => {
  return api.get('/referrals/me/transactions');
};

export const requestReferralPayout = async (): Promise<{ batchId: string; paidCount: number; amount: number; }> => {
  return api.post('/referrals/me/payout', {});
};

// Get referral dashboard data
export const getMyReferralDashboard = async (): Promise<ReferralDashboard> => {
  return api.get('/referrals/me/dashboard');
};

// Admin: Get all referrers overview
export const getAdminReferralOverview = async (): Promise<AdminReferralOverview> => {
  return api.get('/referrals/admin/overview');
};

// Admin: Process payout for a specific referrer
export const adminProcessPayout = async (userId: string, notes?: string): Promise<{ 
  batchId: string; 
  paidCount: number; 
  amount: number;
  referrerEmail: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}> => {
  return api.post(`/referrals/admin/payout/${userId}`, { notes });
};
