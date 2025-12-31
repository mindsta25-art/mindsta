
/**
 * Custom query hook configurations for different data types
 * Optimizes cache timing based on data volatility
 */

// User/Profile data - changes infrequently

// Student/Learning data - moderate updates

// Analytics/Dashboard - frequent updates

// Lessons/Content - rarely changes

// Referral data - moderate updates

// Payment/Transaction data - important, frequent checks

/**
 * Type-safe query hook factory
 * Usage: const query = useOptimizedQuery(['key'], fetcher, userQueryConfig);
 */

/**
 * Type-safe mutation hook factory with optimistic updates support
 */

/**
 * Query key factories for consistent cache management
 * Prevents cache key mismatches
 */

export const queryKeys = {
  // User keys
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  
  // Student keys
  students: ['students'] as const,
  student: (studentId: string) => ['student', studentId] as const,
  studentProgress: (studentId: string) => ['student', studentId, 'progress'] as const,
  
  // Lesson keys
  lessons: ['lessons'] as const,
  lesson: (lessonId: string) => ['lesson', lessonId] as const,
  lessonsByGrade: (grade: string) => ['lessons', 'grade', grade] as const,
  lessonsBySubject: (grade: string, subject: string) => ['lessons', 'grade', grade, 'subject', subject] as const,
  
  // Quiz keys
  quizzes: ['quizzes'] as const,
  quiz: (quizId: string) => ['quiz', quizId] as const,
  
  // Referral keys
  referrals: ['referrals'] as const,
  referralSettings: ['referral', 'settings'] as const,
  referralTransactions: ['referral', 'transactions'] as const,
  referralStats: ['referral', 'stats'] as const,
  
  // Payment keys
  payments: ['payments'] as const,
  payment: (paymentId: string) => ['payment', paymentId] as const,
  
  // Analytics keys
  analytics: ['analytics'] as const,
  analyticsOverview: ['analytics', 'overview'] as const,
  analyticsUserGrowth: (days: number) => ['analytics', 'user-growth', days] as const,
  analyticsRevenue: (days: number) => ['analytics', 'revenue', days] as const,
  analyticsReferrals: (days: number) => ['analytics', 'referrals', days] as const,
  
  // Admin keys
  adminUsers: ['admin', 'users'] as const,
  adminPayouts: ['admin', 'payouts'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
};

/**
 * Helper to invalidate related queries after mutations
 */
export const invalidationGroups = {
  user: [queryKeys.user, queryKeys.userProfile],
  student: [queryKeys.students, queryKeys.student, queryKeys.studentProgress],
  referral: [queryKeys.referrals, queryKeys.referralSettings, queryKeys.referralTransactions, queryKeys.referralStats],
  analytics: [queryKeys.analytics, queryKeys.analyticsOverview],
  admin: [queryKeys.adminUsers, queryKeys.adminPayouts, queryKeys.adminDashboard],
};
