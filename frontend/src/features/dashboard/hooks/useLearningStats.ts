/**
 * Custom hook for managing learning statistics
 */

import { useMemo } from 'react';
import type { UserProgress } from '@/api/progress';
import type { Lesson } from '@/api/lessons';
import {
  calculateStreaks,
  calculateWeeklySeries,
  calculateWeeklyProgress,
  calculatePoints,
  calculateRank,
  calculateAverageScore
} from '../utils/calculations';

export interface LearningStats {
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: number;
  pointsEarned: number;
  rank: string;
}

export const useLearningStats = (
  userProgress: UserProgress[],
  allGradeLessons: Lesson[]
) => {
  const stats = useMemo(() => {
    if (!userProgress || userProgress.length === 0) {
      return null;
    }

    const totalLessonsCompleted = userProgress.filter(p => p.completed).length;
    const totalQuizzesTaken = userProgress.filter(
      p => typeof p.quizScore === 'number'
    ).length;
    
    const averageScore = calculateAverageScore(userProgress);
    const { current: currentStreak, longest: longestStreak } = calculateStreaks(userProgress);
    const weeklyProgress = calculateWeeklyProgress(userProgress);
    const pointsEarned = calculatePoints(userProgress);
    const rank = calculateRank(averageScore, totalLessonsCompleted);

    return {
      totalLessonsCompleted,
      totalQuizzesTaken,
      averageScore,
      currentStreak,
      longestStreak,
      weeklyProgress,
      pointsEarned,
      rank
    } as LearningStats;
  }, [userProgress, allGradeLessons]);

  const weeklySeries = useMemo(() => {
    return calculateWeeklySeries(userProgress);
  }, [userProgress]);

  return { stats, weeklySeries };
};
