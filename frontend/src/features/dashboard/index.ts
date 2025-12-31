/**
 * Dashboard feature exports
 */

// Hooks
export * from './hooks/useStudentInfo';
export * from './hooks/useLearningStats';
export * from './hooks/useSubjects';
export * from './hooks/useRecommendations';
export * from './hooks/useRecentActivities';
export * from './hooks/useContinueLearning';

// Utils
export * from './utils/currency';
export * from './utils/calculations';
export * from './utils/formatters';
export * from './utils/constants';

// Components
export { QuickStats } from './components/QuickStats';
export { ContinueLearning } from './components/ContinueLearning';
export { RecentActivitySection } from './components/RecentActivitySection';
export { AchievementsSection } from './components/AchievementsSection';
export { LearningAnalytics } from './components/LearningAnalytics';
export { DashboardSkeleton } from './components/DashboardSkeleton';
export { ErrorBoundary } from './components/ErrorBoundary';
