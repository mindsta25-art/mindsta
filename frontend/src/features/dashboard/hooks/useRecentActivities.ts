/**
 * Custom hook for managing recent activities
 */

import { useMemo } from 'react';
import type { UserProgress } from '@/api/progress';
import type { Lesson } from '@/api/lessons';
import { formatTimeAgo } from '../utils/formatters';

export interface RecentActivity {
  id: string;
  type: 'lesson' | 'quiz' | 'achievement';
  title: string;
  subject: string;
  score?: number;
  time: string;
  icon: string;
}

export const useRecentActivities = (
  userProgress: UserProgress[],
  allGradeLessons: Lesson[]
) => {
  const recentActivities = useMemo(() => {
    if (!userProgress || !allGradeLessons || allGradeLessons.length === 0) {
      return [];
    }

    const lessonMap = new Map(allGradeLessons.map(l => [l.id, l]));

    return [...userProgress]
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 6)
      .map((p, idx) => {
        const lesson = lessonMap.get(p.lessonId);
        const isQuiz = typeof p.quizScore === 'number';

        return {
          id: `${idx}-${p.lessonId}`,
          type: isQuiz ? 'quiz' : 'lesson',
          title: lesson?.title || (isQuiz ? 'Quiz' : 'Lesson'),
          subject: lesson?.subject || '',
          score: isQuiz ? p.quizScore : undefined,
          time: formatTimeAgo(new Date(p.lastAccessedAt)),
          icon: isQuiz ? '📝' : '📘',
        } as RecentActivity;
      });
  }, [userProgress, allGradeLessons]);

  return recentActivities;
};
