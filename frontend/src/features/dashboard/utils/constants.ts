/**
 * Dashboard constants and configuration
 */

export const SUBJECTS_PER_PAGE = 8;

export const DEFAULT_LESSON_PRICE = 1200;

export const TERM_NAMES = ['First Term', 'Second Term', 'Third Term'] as const;

export const TERM_COLORS = [
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-blue-500'
] as const;

export const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 'Common Entrance'] as const;

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500'
} as const;

export const STAT_CARD_CONFIGS = [
  {
    key: 'lessons',
    label: 'Lessons',
    icon: 'BookMarked',
    color: 'blue'
  },
  {
    key: 'avgScore',
    label: 'Avg Score',
    icon: 'Target',
    color: 'green'
  },
  {
    key: 'streak',
    label: 'Streak',
    icon: 'Flame',
    color: 'orange'
  },
  {
    key: 'points',
    label: 'Points',
    icon: 'Trophy',
    color: 'indigo'
  }
] as const;

export const ANIMATION_DELAYS = {
  quickStats: 0.1,
  continueLearning: 0.2,
  browseByGrade: 0.3,
  recentActivity: 0.4,
  recommended: 0.5,
  subjects: 0.6
} as const;
