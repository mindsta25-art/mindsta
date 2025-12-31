/**
 * Quizzes API (MongoDB via Node.js Backend)
 * Handles quiz and questions management
 */

import { api } from '@/lib/apiClient';

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  lessonSubject?: string;
  lessonGrade?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  questionCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get all quizzes (admin)
 */
export const getAllQuizzes = async (): Promise<Quiz[]> => {
  try {
    const result = await api.get('/quizzes');
    return result;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
};

/**
 * Get quiz by lesson ID
 */
export const getQuizByLessonId = async (lessonId: string): Promise<Quiz | null> => {
  try {
    const result = await api.get(`/quizzes/lesson/${lessonId}`);
    return result;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return null;
  }
};

/**
 * Get quiz by ID
 */
export const getQuizById = async (id: string): Promise<Quiz | null> => {
  try {
    const result = await api.get(`/quizzes/${id}`);
    return result;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return null;
  }
};

/**
 * Create a new quiz (admin only)
 */
export const createQuiz = async (quiz: Partial<Quiz>): Promise<Quiz> => {
  try {
    const result = await api.post('/quizzes', quiz);
    return result;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

/**
 * Update a quiz (admin only)
 */
export const updateQuiz = async (id: string, updates: Partial<Quiz>): Promise<Quiz> => {
  try {
    const result = await api.put(`/quizzes/${id}`, updates);
    return result;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

/**
 * Delete a quiz (admin only)
 */
export const deleteQuiz = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/quizzes/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return false;
  }
};
