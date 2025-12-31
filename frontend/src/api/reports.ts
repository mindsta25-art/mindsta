/**
 * Reports API
 * Handles report generation and export
 */

import { api } from '@/lib/apiClient';

export interface ReportParams {
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  grade?: string;
  subject?: string;
  term?: string;
  userType?: string;
  format?: 'json' | 'csv' | 'excel' | 'pdf';
  limit?: number;
}

export interface StudentProgressReport {
  type: 'student-progress';
  period: string;
  generatedAt: string;
  summary: {
    totalStudents: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    highPerformers: number;
    needsSupport: number;
  };
  data: Array<{
    studentId: string;
    name: string;
    email: string;
    grade: string;
    schoolName: string;
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
    avgQuizScore: number;
    lastActive: string;
  }>;
}

export interface LessonAnalyticsReport {
  type: 'lesson-analytics';
  period: string;
  filters: {
    subject?: string;
    grade?: string;
  };
  generatedAt: string;
  summary: {
    totalLessons: number;
    totalStarts: number;
    totalCompletions: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    topPerformers: Array<{ title: string; score: number }>;
  };
  data: Array<{
    lessonId: string;
    title: string;
    subject: string;
    grade: string;
    term: string;
    started: number;
    completed: number;
    completionRate: number;
    avgQuizScore: number;
    quizAttempts: number;
    engagementScore: number;
    createdAt: string;
  }>;
}

export interface EngagementSummaryReport {
  type: 'engagement-summary';
  period: string;
  generatedAt: string;
  summary: {
    activeUsers: number;
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    quizAttempts: number;
    avgSessionsPerUser: number;
    peakActivityHour: number;
    peakActivityCount: number;
  };
  userTypeBreakdown: Record<string, number>;
  activityByDay: Record<string, number>;
  activityByHour: Array<{ hour: number; count: number }>;
}

export interface GradePerformanceReport {
  type: 'grade-performance';
  period: string;
  generatedAt: string;
  summary: {
    totalGrades: number;
    totalStudents: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    topPerformingGrade: string;
  };
  data: Array<{
    grade: string;
    totalStudents: number;
    activeStudents: number;
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
    avgQuizScore: number;
    quizAttempts: number;
    subjectBreakdown: Record<string, { total: number; completed: number }>;
  }>;
}

export interface UserActivityReport {
  type: 'user-activity';
  period: string;
  filters: {
    userType?: string;
  };
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  data: Array<{
    userId: string;
    email: string;
    fullName: string;
    userType: string;
    status: string;
    lastActivity: string;
    recentActions: number;
    completedActions: number;
    joinedAt: string;
  }>;
}

export interface ContentInventoryReport {
  type: 'content-inventory';
  filters: {
    grade?: string;
    subject?: string;
    term?: string;
  };
  generatedAt: string;
  summary: {
    totalLessons: number;
    lessonsWithVideo: number;
    totalQuizzes: number;
    totalQuestions: number;
    avgQuestionsPerQuiz: number;
  };
  data: Array<{
    lessonId: string;
    title: string;
    subject: string;
    grade: string;
    term: string;
    description: string;
    videoUrl: string;
    contentLength: number;
    quizCount: number;
    totalQuestions: number;
    timesAccessed: number;
    timesCompleted: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * Generate student progress report
 */
export const generateStudentProgressReport = async (
  params: ReportParams = {}
): Promise<StudentProgressReport | Blob> => {
  if (params.format === 'csv') {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/student-progress?${new URLSearchParams(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
    return response.blob();
  }
  return api.get('/reports/student-progress', params);
};

/**
 * Generate lesson analytics report
 */
export const generateLessonAnalyticsReport = async (
  params: ReportParams = {}
): Promise<LessonAnalyticsReport | Blob> => {
  if (params.format === 'csv') {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/lesson-analytics?${new URLSearchParams(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
    return response.blob();
  }
  return api.get('/reports/lesson-analytics', params);
};

/**
 * Generate engagement summary report
 */
export const generateEngagementSummaryReport = async (
  params: ReportParams = {}
): Promise<EngagementSummaryReport | Blob> => {
  if (params.format === 'csv') {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/engagement-summary?${new URLSearchParams(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
    return response.blob();
  }
  return api.get('/reports/engagement-summary', params);
};

/**
 * Generate grade performance report
 */
export const generateGradePerformanceReport = async (
  params: ReportParams = {}
): Promise<GradePerformanceReport | Blob> => {
  if (params.format === 'csv') {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/grade-performance?${new URLSearchParams(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
    return response.blob();
  }
  return api.get('/reports/grade-performance', params);
};

/**
 * Generate user activity report
 */
export const generateUserActivityReport = async (
  params: ReportParams = {}
): Promise<UserActivityReport | Blob> => {
  if (params.format === 'csv') {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/user-activity?${new URLSearchParams(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
    return response.blob();
  }
  return api.get('/reports/user-activity', params);
};

/**
 * Generate content inventory report
 */
export const generateContentInventoryReport = async (
  params: ReportParams = {}
): Promise<ContentInventoryReport | Blob> => {
  if (params.format === 'csv') {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/content-inventory?${new URLSearchParams(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
    return response.blob();
  }
  return api.get('/reports/content-inventory', params);
};

/**
 * Download report as file
 */
export const downloadReport = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
