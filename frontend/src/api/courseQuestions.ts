import { api } from '@/lib/apiClient';

export interface CourseQuestion {
  id: string;
  _id?: string;
  userId: string;
  studentName: string;
  subject: string;
  grade: string;
  term?: string;
  lessonId?: string;
  lessonTitle?: string;
  question: string;
  answers: CourseAnswer[];
  upvotes: number;
  views: number;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

export interface CourseAnswer {
  id: string;
  _id?: string;
  userId: string;
  userName: string;
  isInstructor: boolean;
  answer: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get questions for a course (subject + grade + term)
 */
export const getCourseQuestions = async (
  subject: string,
  grade: string,
  term?: string,
  lessonId?: string
): Promise<CourseQuestion[]> => {
  try {
    const params = new URLSearchParams();
    params.append('subject', subject);
    params.append('grade', grade);
    if (term) params.append('term', term);
    if (lessonId) params.append('lessonId', lessonId);
    
    const result = await api.get(`/course-questions?${params.toString()}`);
    return result;
  } catch (error) {
    console.error('Error fetching course questions:', error);
    return [];
  }
};

/**
 * Get all questions (admin only)
 */
export const getAllCourseQuestions = async (): Promise<CourseQuestion[]> => {
  try {
    const result = await api.get('/course-questions/all');
    return result;
  } catch (error) {
    console.error('Error fetching all questions:', error);
    return [];
  }
};

/**
 * Create a new question
 */
export const createCourseQuestion = async (
  questionData: {
    subject: string;
    grade: string;
    term?: string;
    lessonId?: string;
    question: string;
  }
): Promise<CourseQuestion> => {
  const result = await api.post('/course-questions', questionData);
  return result;
};

/**
 * Add an answer to a question
 */
export const addCourseAnswer = async (
  questionId: string,
  answer: string
): Promise<CourseQuestion> => {
  const result = await api.post(`/course-questions/${questionId}/answers`, { answer });
  return result;
};

/**
 * Accept an answer (question owner only)
 */
export const acceptAnswer = async (
  questionId: string,
  answerId: string
): Promise<CourseQuestion> => {
  const result = await api.post(`/course-questions/${questionId}/answers/${answerId}/accept`);
  return result;
};

/**
 * Upvote a question
 */
export const upvoteQuestion = async (questionId: string): Promise<CourseQuestion> => {
  const result = await api.post(`/course-questions/${questionId}/upvote`);
  return result;
};

/**
 * Upvote an answer
 */
export const upvoteAnswer = async (
  questionId: string,
  answerId: string
): Promise<CourseQuestion> => {
  const result = await api.post(`/course-questions/${questionId}/answers/${answerId}/upvote`);
  return result;
};

/**
 * Delete a question (owner or admin only)
 */
export const deleteCourseQuestion = async (questionId: string): Promise<void> => {
  await api.delete(`/course-questions/${questionId}`);
};

/**
 * Delete an answer (owner or admin only)
 */
export const deleteCourseAnswer = async (
  questionId: string,
  answerId: string
): Promise<void> => {
  await api.delete(`/course-questions/${questionId}/answers/${answerId}`);
};
