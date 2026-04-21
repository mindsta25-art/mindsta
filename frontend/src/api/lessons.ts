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
  imageDisplaySize?: 'full' | 'large' | 'medium' | 'small';
  imageObjectFit?: 'cover' | 'contain' | 'fill';
  keywords?: string[];
  learningObjectives?: string[];
  whatYouWillLearn?: string[];
  requirements?: string[];
  targetAudience?: string[];
  curriculum?: Section[];
  quizCount?: number; // Total quizzes for this course
  price?: number; // Price in Naira
  isPublished?: boolean; // false = draft (only visible to admins)
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
 * Lightweight server-side search — used by the header search box and search page.
 */
export const searchLessons = async (q: string, grade?: string, subject?: string, limit = 20): Promise<Lesson[]> => {
  try {
    const params = new URLSearchParams();
    if (q.trim()) params.append('q', q.trim());
    if (grade) params.append('grade', grade);
    if (subject) params.append('subject', subject);
    params.append('limit', String(limit));
    const result = await api.get(`/lessons/search?${params.toString()}`);
    return result;
  } catch (error) {
    return [];
  }
};

/**
 * Get all lessons
 */
export const getLessons = async (subject?: string, grade?: string, term?: string, enrolledOnly?: boolean): Promise<Lesson[]> => {
  try {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (grade) params.append('grade', grade);
    if (term) params.append('term', term);
    if (enrolledOnly) params.append('enrolledOnly', 'true');
    
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
 * Get draft lessons for admins only
 */
export const getDraftLessons = async (): Promise<Lesson[]> => {
  try {
    const result = await api.get(`/lessons?isPublished=false`);
    return result;
  } catch (error) {
    console.error('Error fetching draft lessons:', error);
    return [];
  }
};

/**
 * Get lesson by ID
 * Returns null if lesson not found or not enrolled (403)
 */
export const getLessonById = async (id: string): Promise<Lesson | null> => {
  try {
    const result = await api.get(`/lessons/${id}`);
    return result;
  } catch (error: any) {
    // Handle 403 Forbidden (not enrolled)
    if (error?.response?.status === 403) {
      console.warn(`Access denied to lesson ${id}: Not enrolled`);
      return null;
    }
    console.error('Error fetching lesson:', error);
    return null;
  }
};

/**
 * Get lesson preview metadata for cart/checkout and browse preview.
 */
export const getLessonPreviewById = async (id: string): Promise<Lesson | null> => {
  try {
    const result = await api.get(`/lessons/${id}/preview`);
    return result;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error(`Error fetching lesson preview ${id}:`, error);
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
