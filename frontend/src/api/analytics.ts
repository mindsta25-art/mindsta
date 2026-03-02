/**
 * Analytics API (MongoDB via Node.js Backend)
 * Handles analytics and dashboard statistics
 */

import { api } from '@/lib/apiClient';

export interface DashboardStats {
  totalStudents: number;
  totalLessons: number;
  activeUsers: number;
  completionRate: number;
  averageScore: number;
}

interface GradeDistribution {
  grade: number;
  students: number;
}

interface UserGrowth {
  month: string;
  year: number;
  users: number;
}

interface LessonCompletion {
  subject: string;
  completions: number;
}

interface EngagementMetrics {
  avgTimePerLesson: number;
  completionRate: number;
  quizAccuracy: number;
  activeUsers: number;
  peakActivityHour: number;
  totalSessions: number;
}

interface ActivityPatterns {
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  avgSessionDuration: number;
  retentionRate: number;
}

export interface DetailedAnalytics {
  gradeDistribution: GradeDistribution[];
  userGrowth: UserGrowth[];
  lessonCompletions: LessonCompletion[];
  engagementMetrics: EngagementMetrics;
  activityPatterns: ActivityPatterns;
}

/**
 * Get dashboard statistics (admin only)
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const result = await api.get('/analytics/dashboard');
    return result;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalStudents: 0,
      totalLessons: 0,
      activeUsers: 0,
      completionRate: 0,
      averageScore: 0,
    };
  }
};

/**
 * Get overview statistics with user counts (admin only)
 */
export const getOverviewStats = async () => {
  try {
    const result = await api.get('/analytics/overview');
    return result;
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return null;
  }
};

/**
 * Get detailed analytics with optional date range and grade filters
 */
export const getDetailedAnalytics = async (params?: {
  startDate?: string;
  endDate?: string;
  grade?: number;
}): Promise<DetailedAnalytics | null> => {
  try {
    const result = await api.get('/analytics/detailed', params);
    return result;
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    return null;
  }
};

/**
 * Export analytics data in specified format
 */
export const exportAnalytics = async (format: 'json' | 'csv' = 'json', type: string = 'all'): Promise<Blob | any> => {
  try {
    const result = await api.get('/analytics/export', { format, type });
    return result;
  } catch (error) {
    console.error('Error exporting analytics:', error);
    throw error;
  }
};

/**
 * Get recent course purchases with user details (admin only)
 */
export const getRecentPurchases = async (limit: number = 20) => {
  try {
    const result = await api.get('/analytics/recent-purchases', { limit });
    return result;
  } catch (error) {
    console.error('Error fetching recent purchases:', error);
    return [];
  }
};

/**
 * Get enrollment statistics by subject, grade, and term (admin only)
 */
export const getEnrollmentStats = async () => {
  try {
    const result = await api.get('/analytics/enrollment-stats');
    return result;
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    return null;
  }
};

/**
 * Get user growth analytics for the specified number of days (admin only)
 */
export const getUserGrowth = async (days: number = 30) => {
  try {
    const result = await api.get('/analytics/user-growth', { days });
    return result;
  } catch (error) {
    console.error('Error fetching user growth:', error);
    return [];
  }
};

/**
 * Get revenue over time analytics (admin only)
 */
export const getRevenueOverTime = async (days: number = 30) => {
  try {
    const result = await api.get('/analytics/revenue-over-time', { days });
    return result;
  } catch (error) {
    console.error('Error fetching revenue over time:', error);
    return [];
  }
};

/**
 * Get referral performance analytics (admin only)
 */
export const getReferralPerformance = async (days: number = 30) => {
  try {
    const result = await api.get('/analytics/referral-performance', { days });
    return result;
  } catch (error) {
    console.error('Error fetching referral performance:', error);
    return null;
  }
};

/**
 * Get user types distribution (admin only)
 */
export const getUserTypes = async () => {
  try {
    const result = await api.get('/analytics/user-types');
    return result;
  } catch (error) {
    console.error('Error fetching user types:', error);
    return [];
  }
};

/**
 * Get payment status distribution (admin only)
 */
export const getPaymentStatusDistribution = async () => {
  try {
    const result = await api.get('/analytics/payment-status');
    return result;
  } catch (error) {
    console.error('Error fetching payment status distribution:', error);
    return [];
  }
};

/**
 * Get student grade distribution (admin only)
 */
export const getStudentGrades = async () => {
  try {
    const result = await api.get('/analytics/student-grades');
    return result;
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return [];
  }
};

export interface StudentStudyTime {
  userId: string;
  name: string;
  email: string;
  totalMinutes: number;
  todayMinutes: number;
  weeklyMinutes: number;
  lastStudyDate: string | null;
  joinedAt: string;
}

/**
 * Get all students' study time data (admin only)
 */
export const getAdminStudentStudyTime = async (): Promise<StudentStudyTime[]> => {
  try {
    const result = await api.get('/gamification/admin/students-study-time');
    return result.students || [];
  } catch (error) {
    console.error('Error fetching student study times:', error);
    return [];
  }
};
