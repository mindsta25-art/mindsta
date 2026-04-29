import { api } from '@/lib/apiClient';

export interface CEQuestion {
  id?: string;
  question: string;
  imageUrl?: string | null;
  options: [string, string, string, string];
  correctAnswer: number; // 0-3
  explanation: string;
}

export interface CommonExam {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  overview: string;
  subject: string;
  imageUrl?: string | null;
  imageDisplaySize?: string;
  imageObjectFit?: string;
  price: number;
  passingScore: number;
  timeLimit: number;
  isPublished: boolean;
  questionCount: number;
  enrolledStudents: number;
  rating: number;
  ratingsCount: number;
  createdAt: string;
  updatedAt: string;
  questions?: CEQuestion[];
}

export interface SubmitResult {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  results: Array<{
    questionId: string;
    selected: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

// List all published exams (students) or all (admin)
export const getCommonExams = async (subject?: string): Promise<CommonExam[]> => {
  try {
    const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    const data = await api.get(`/common-entrance${params}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[getCommonExams]', error);
    return [];
  }
};

// Get single exam (students get no answers; admin gets full data)
export const getCommonExamById = async (id: string): Promise<CommonExam | null> => {
  try {
    return await api.get(`/common-entrance/${id}`);
  } catch (error) {
    console.error('[getCommonExamById]', error);
    return null;
  }
};

// Submit answers and get score
export const submitCommonExam = async (id: string, answers: number[]): Promise<SubmitResult> => {
  return api.post(`/common-entrance/${id}/submit`, { answers });
};

// Admin: create exam
export const createCommonExam = async (data: {
  title: string;
  subtitle?: string;
  description?: string;
  overview?: string;
  subject: string;
  imageUrl?: string | null;
  imageDisplaySize?: string;
  imageObjectFit?: string;
  price?: number;
  questions: CEQuestion[];
  passingScore?: number;
  timeLimit?: number;
  isPublished?: boolean;
}): Promise<CommonExam> => {
  return api.post('/common-entrance', data);
};

// Admin: update exam
export const updateCommonExam = async (id: string, data: Partial<{
  title: string;
  subtitle: string;
  description: string;
  overview: string;
  subject: string;
  imageUrl: string | null;
  imageDisplaySize: string;
  imageObjectFit: string;
  price: number;
  questions: CEQuestion[];
  passingScore: number;
  timeLimit: number;
  isPublished: boolean;
}>): Promise<CommonExam> => {
  return api.put(`/common-entrance/${id}`, data);
};

// Admin: delete exam
export const deleteCommonExam = async (id: string): Promise<void> => {
  return api.delete(`/common-entrance/${id}`);
};

// Admin: toggle publish
export const toggleCommonExamPublish = async (id: string): Promise<{ id: string; isPublished: boolean }> => {
  return api.patch(`/common-entrance/${id}/publish`, {});
};
