/**
 * Progress API (MongoDB via Node.js Backend)
 * Handles user progress tracking
 */

import { api } from '@/lib/apiClient';

export interface UserProgress {
  _id?: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  currentSection?: number;
  quizScore?: number;
  timeSpent?: number;
  videoPosition?: number;      // seconds into the video where the student stopped
  videoWatchPercent?: number;  // 0–100, highest percentage reached
  streak?: number;
  lastAccessedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get user progress
 */
export const getUserProgress = async (userId: string): Promise<UserProgress[]> => {
  try {
    const result = await api.get(`/progress/${userId}`);
    return result;
  } catch (error) {
    console.error('Error fetching progress:', error);
    return [];
  }
};

/**
 * Update or create progress
 */
export const updateProgress = async (progress: Omit<UserProgress, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserProgress> => {
  try {
    const result = await api.post('/progress', progress);
    return result;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

/**
 * Upsert progress (alias for updateProgress)
 */
export const upsertProgress = updateProgress;
