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
