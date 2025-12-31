/**
 * Custom hook for managing continue learning feature
 */

import { useMemo } from 'react';
import type { UserProgress } from '@/api/progress';
import type { Lesson } from '@/api/lessons';

export interface ContinueLearningData {
  lesson: Lesson;
  lastAccessed: Date;
  progress?: number;
}

export const useContinueLearning = (
  userProgress: UserProgress[],
  allGradeLessons: Lesson[]
) => {
  const continueData = useMemo(() => {
    if (!userProgress || !allGradeLessons || allGradeLessons.length === 0) {
      return null;
    }

    const lessonMap = new Map(allGradeLessons.map(l => [l.id, l]));

    // Find most recent incomplete lesson
    const incomplete = [...userProgress]
      .filter(p => !p.completed)
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());

    const cont = incomplete.find(p => lessonMap.has(p.lessonId));

    if (cont) {
      const lesson = lessonMap.get(cont.lessonId)!;
      // Calculate progress based on quiz score or time spent
      const calculatedProgress = cont.quizScore || (cont.timeSpent ? Math.min(cont.timeSpent / 30, 100) : 0);
      return {
        lesson,
        lastAccessed: new Date(cont.lastAccessedAt),
        progress: Math.round(calculatedProgress)
      } as ContinueLearningData;
    }

    return null;
  }, [userProgress, allGradeLessons]);

  return continueData;
};
