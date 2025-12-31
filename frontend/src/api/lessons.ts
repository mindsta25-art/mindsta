/**
 * Lessons API (MongoDB via Node.js Backend)
 * Handles lesson content and management
 */

import { api } from '@/lib/apiClient';

export interface Resource {
  title: string;
  type: 'pdf' | 'document' | 'video' | 'link' | 'image' | 'other';
  url: string;
  size?: string;
  description?: string;
}

export interface Lecture {
  _id?: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'assignment';
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  resources?: Resource[];
  isPreview?: boolean;
}

export interface Section {
  _id?: string;
  title: string;
  description?: string;
  order: number;
  lectures: Lecture[];
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  content?: string; // Legacy field
  subject: string;
  grade: string;
  term: string;
  order?: number;
  difficulty: string;
  duration?: number;
  videoUrl?: string; // Legacy field
  imageUrl?: string;
  keywords?: string[];
  learningObjectives?: string[];
  whatYouWillLearn?: string[];
  requirements?: string[];
  targetAudience?: string[];
  curriculum?: Section[];
  price?: number; // Price in Naira
  rating?: number; // Average rating (0-5)
  ratingsCount?: number; // Number of ratings
  enrolledStudents?: number; // Number of enrolled students
  createdAt: string;
  updatedAt?: string;
}

export type LessonData = Lesson;

export interface SubjectInfo {
  name: string;
  lessonCount: number;
  price?: number;
  rating?: number;
  ratingsCount?: number;
  enrolledStudents?: number;
  duration?: number;
  difficulty?: string;
}

export interface TermInfo {
  name: string;
  subjectCount: number;
  lessonCount: number;
}

/**
 * Get terms available for a specific grade
 */
export const getTermsByGrade = async (grade: string): Promise<TermInfo[]> => {
  try {
    const result = await api.get(`/lessons/terms-by-grade/${grade}`);
    return result;
  } catch (error) {
    console.error('Error fetching terms by grade:', error);
    return [];
  }
};

/**
 * Get subjects available for a specific grade and optional term
 */
export const getSubjectsByGrade = async (grade: string, term?: string): Promise<SubjectInfo[]> => {
  try {
    const params = term ? `?term=${encodeURIComponent(term)}` : '';
    const result = await api.get(`/lessons/subjects-by-grade/${grade}${params}`);
    return result;
  } catch (error) {
    console.error('Error fetching subjects by grade:', error);
    return [];
  }
};

/**
 * Get all lessons
 */
export const getLessons = async (subject?: string, grade?: string, term?: string): Promise<Lesson[]> => {
  try {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (grade) params.append('grade', grade);
    if (term) params.append('term', term);
    
    const result = await api.get(`/lessons?${params.toString()}`);
    return result;
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
};

/**
 * Get lessons by subject, grade, and term
 */
export const getLessonsBySubjectAndGrade = async (subject: string, grade: string, term?: string): Promise<Lesson[]> => {
  return getLessons(subject, grade, term);
};

/**
 * Get all lessons (alias for admin)
 */
export const getAllLessons = async (): Promise<Lesson[]> => {
  return getLessons();
};

/**
 * Get lesson by ID
 */
export const getLessonById = async (id: string): Promise<Lesson | null> => {
  try {
    const result = await api.get(`/lessons/${id}`);
    return result;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
};

/**
 * Create a new lesson (admin only)
 */
export const createLesson = async (lesson: Partial<Lesson>): Promise<Lesson> => {
  try {
    const result = await api.post('/lessons', lesson);
    return result;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

/**
 * Update a lesson (admin only)
 */
export const updateLesson = async (id: string, updates: Partial<Lesson>): Promise<Lesson> => {
  try {
    const result = await api.put(`/lessons/${id}`, updates);
    return result;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

/**
 * Delete a lesson (admin only)
 */
export const deleteLesson = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/lessons/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
};
