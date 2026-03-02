import { api } from '@/lib/apiClient';

export interface GamificationStats {
  coins: number;
  achievements: Array<{
    achievementId: string;
    unlockedAt: string;
    progress: number;
  }>;
  weeklyGoal: {
    dailyLessons: number;
    enabled: boolean;
  };
  streakFreezes: {
    available: number;
    lastEarnedAt?: string;
  };
  studyReminders: {
    enabled: boolean;
    time: string;
    timezone: string;
  };
  stats: {
    completedLessons: number;
    enrollments: number;
    currentStreak: number;
    lessonsCompletedToday: number;
    perfectQuizzes: number;
    studyMinutesToday: number;
    totalLessonsCompleted: number;
  };
  leaderboard?: {
    visible: boolean;
    showFullName: boolean;
  };
  newAchievements?: Array<{
    achievementId: string;
    unlockedAt: string;
  }>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  coinReward: number;
  gradient: string;
  isUnlocked: boolean;
  progress: number;
  progressPercentage: number;
}

export interface AnalyticsData {
  subjectPerformance: Array<{
    subject: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
  weeklyActivity: Array<{
    date: string;
    dayName: string;
    minutes: number;
    lessonsCompleted: number;
  }>;
  totalLessonsCompleted: number;
  totalEnrollments: number;
  currentStreak: number;
  bestStreak: number;
  avgMinutesPerDay: number;
  totalStudyMinutes: number;
  strongest: {
    subject: string;
    completed: number;
    total: number;
    percentage: number;
  } | null;
  weakest: {
    subject: string;
    completed: number;
    total: number;
    percentage: number;
  } | null;
}

export const getGamificationStats = async (): Promise<GamificationStats> => {
  return api.get('/gamification/stats');
};

export const updateWeeklyGoal = async (dailyLessons: number, enabled: boolean) => {
  return api.put('/gamification/weekly-goal', {
    dailyLessons,
    enabled,
  });
};

export const useStreakFreeze = async () => {
  return api.post('/gamification/use-freeze', {});
};

export const updateStudyReminders = async (data: {
  enabled?: boolean;
  time?: string;
  timezone?: string;
}) => {
  return api.put('/gamification/study-reminders', data);
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
  return api.get('/gamification/analytics');
};

export const getAchievements = async (): Promise<{ achievements: Achievement[] }> => {
  return api.get('/gamification/achievements');
};

export const recordStudyTime = async (minutes: number) => {
  return api.post('/gamification/record-study-time', { minutes });
};

export const getRecommendations = async () => {
  return api.get('/gamification/recommendations');
};

// Milestones
export const getMilestones = async () => {
  return api.get('/gamification/milestones');
};

// Mastery
export const getMastery = async () => {
  return api.get('/gamification/mastery');
};

// Leaderboard
export const getLeaderboard = async (timeframe = 'allTime', scope = 'global') => {
  return api.get('/gamification/leaderboard', { timeframe, scope });
};

export const updateLeaderboardSettings = async (visible: boolean, showFullName: boolean) => {
  return api.put('/gamification/leaderboard-settings', {
    visible,
    showFullName,
  });
};

// Quote of the day
export const getQuoteOfDay = async () => {
  return api.get('/gamification/quote-of-day');
};

// Quick quiz
export const getQuickQuiz = async () => {
  return api.get('/gamification/quick-quiz');
};
