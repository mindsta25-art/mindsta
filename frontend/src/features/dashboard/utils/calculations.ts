/**
 * Learning statistics and progress calculation utilities
 */

import type { UserProgress } from "@/api/progress";
import type { Lesson } from "@/api/lessons";

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Calculate current and longest learning streaks based on user progress
 */
export const calculateStreaks = (userProgress: UserProgress[]): StreakResult => {
  const daysWithActivity = Array.from(
    new Set(userProgress.map(p => new Date(p.lastAccessedAt).toDateString()))
  )
    .map(d => new Date(d).getTime())
    .sort((a, b) => a - b);

  let longest = 0;
  let current = 0;
  let prevDay: number | null = null;
  
  const todayStr = new Date().toDateString();
  const todayMs = new Date(todayStr).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const day of daysWithActivity) {
    if (prevDay === null || day - prevDay === dayMs) {
      current += 1;
    } else {
      longest = Math.max(longest, current);
      current = 1;
    }
    prevDay = day;
  }
  
  longest = Math.max(longest, current);
  
  // Reset current streak if last activity wasn't today or yesterday
  if (!(daysWithActivity.includes(todayMs) || daysWithActivity.includes(todayMs - dayMs))) {
    current = 0;
  }

  return { current, longest };
};

/**
 * Calculate weekly progress series for sparkline charts
 */
export const calculateWeeklySeries = (userProgress: UserProgress[]): number[] => {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const series: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const target = new Date(dayStart.getTime() - i * dayMs);
    const next = new Date(target.getTime() + dayMs);
    
    const count = userProgress.filter(p => {
      const t = new Date(p.lastAccessedAt).getTime();
      return t >= target.getTime() && t < next.getTime();
    }).length;
    
    series.push(count);
  }

  return series;
};

/**
 * Calculate weekly progress percentage
 */
export const calculateWeeklyProgress = (userProgress: UserProgress[]): number => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  
  const weekly = userProgress.filter(p => new Date(p.lastAccessedAt) >= weekAgo);
  return Math.min(100, Math.round((weekly.length / 10) * 100));
};

/**
 * Calculate points earned based on lessons and quiz scores
 */
export const calculatePoints = (userProgress: UserProgress[]): number => {
  const completedLessons = userProgress.filter(p => p.completed).length;
  const quizPoints = userProgress
    .filter(p => typeof p.quizScore === 'number')
    .reduce((sum, p) => sum + ((p.quizScore || 0) / 10) * 5, 0);
  
  return completedLessons * 20 + Math.round(quizPoints);
};

/**
 * Determine rank based on performance
 */
export const calculateRank = (averageScore: number, totalCompleted: number): string => {
  if (averageScore >= 85 && totalCompleted >= 20) return 'Gold Level';
  if (averageScore >= 70) return 'Silver Level';
  return 'Bronze Level';
};

/**
 * Calculate average quiz score
 */
export const calculateAverageScore = (userProgress: UserProgress[]): number => {
  const quizEntries = userProgress.filter(p => typeof p.quizScore === 'number');
  
  if (quizEntries.length === 0) return 0;
  
  const sum = quizEntries.reduce((acc, p) => acc + (p.quizScore || 0), 0);
  return Math.round(sum / quizEntries.length);
};

/**
 * Find next uncompleted lesson in a subject
 */
export const findNextLesson = (
  lessons: Lesson[],
  userProgress: UserProgress[]
): Lesson | undefined => {
  const sortedLessons = [...lessons].sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    
    if (ao !== bo) return ao - bo;
    
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sortedLessons.find(
    l => !userProgress.some(p => p.lessonId === l.id && p.completed)
  );
};
