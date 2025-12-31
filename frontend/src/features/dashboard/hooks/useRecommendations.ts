/**
 * Custom hook for generating personalized recommendations
 */

import { useMemo } from 'react';
import type { UserProgress } from '@/api/progress';
import type { Lesson } from '@/api/lessons';
import { findNextLesson } from '../utils/calculations';

export interface RecommendedLesson {
  lesson: Lesson;
  reason: string;
}

export const useRecommendations = (
  userProgress: UserProgress[],
  allGradeLessons: Lesson[],
  continueLesson?: Lesson
) => {
  const recommended = useMemo(() => {
    if (!userProgress || !allGradeLessons || allGradeLessons.length === 0) {
      return [];
    }

    // Group lessons by subject
    const bySubject = new Map<
      string,
      { lessons: Lesson[]; completedCount: number; total: number; scores: number[] }
    >();

    for (const lesson of allGradeLessons) {
      const entry = bySubject.get(lesson.subject) || {
        lessons: [],
        completedCount: 0,
        total: 0,
        scores: []
      };
      
      entry.lessons.push(lesson);
      entry.total += 1;
      
      if (userProgress.some(p => p.lessonId === lesson.id && p.completed)) {
        entry.completedCount += 1;
      }
      
      const score = userProgress.find(
        p => p.lessonId === lesson.id && typeof p.quizScore === 'number'
      )?.quizScore;
      
      if (typeof score === 'number') {
        entry.scores.push(score);
      }
      
      bySubject.set(lesson.subject, entry);
    }

    // Rank subjects by priority
    const subjectRank = Array.from(bySubject.entries())
      .map(([subject, info]) => {
        const completionRate = info.total > 0 ? info.completedCount / info.total : 0;
        const avgScore = info.scores.length
          ? info.scores.reduce((a, b) => a + b, 0) / info.scores.length
          : null;
        
        return { subject, info, completionRate, avgScore };
      })
      .sort((a, b) => {
        const aScore = a.avgScore ?? 100;
        const bScore = b.avgScore ?? 100;
        
        // Prioritize low scores
        if (aScore < 70 || bScore < 70) return aScore - bScore;
        
        // Then low completion
        return a.completionRate - b.completionRate;
      });

    const recommendations: RecommendedLesson[] = [];

    for (const s of subjectRank) {
      const next = findNextLesson(s.info.lessons, userProgress);
      
      if (next) {
        let reason = '';
        
        if (s.avgScore !== null && s.avgScore < 70) {
          reason = `Low quiz score: ${Math.round(s.avgScore)}%`;
        } else {
          reason = `Low completion: ${Math.round(s.completionRate * 100)}% done`;
        }
        
        // Avoid duplicating the continue lesson
        if (!continueLesson || continueLesson.id !== next.id) {
          recommendations.push({ lesson: next, reason });
        }
      }
      
      if (recommendations.length >= 3) break;
    }

    return recommendations;
  }, [userProgress, allGradeLessons, continueLesson]);

  return recommended;
};
