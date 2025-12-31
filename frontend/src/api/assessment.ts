/**
 * Assessment API
 * Handles grade assessment operations
 */

import { api } from '@/lib/apiClient';

export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  grade: string;
  difficulty: string;
  lessonId?: string;
}

export interface AssessmentQuestionsResponse {
  questions: AssessmentQuestion[];
  totalQuestions: number;
  grades: string[];
}

export interface AnswerSubmission {
  questionIndex: number;
  selectedAnswer: number;
  correctAnswer: number;
  grade: string;
  subject: string;
}

export interface GradePerformance {
  grade: string;
  correct: number;
  total: number;
  percentage: number;
  subjects: Record<string, { correct: number; total: number }>;
}

export interface SubjectBreakdown {
  subject: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface Recommendation {
  type: 'primary' | 'improvement' | 'strength' | 'next_steps' | 'action' | 'study_tip' | 'schedule' | 'resources' | 'tracking' | 'motivation';
  icon: string;
  title: string;
  message: string;
}

export interface AssessmentEvaluationResponse {
  recommendedGrade: string;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  overallScore: {
    correct: number;
    total: number;
    percentage: number;
  };
  gradePerformance: GradePerformance[];
  subjectBreakdown: SubjectBreakdown[];
  weakSubjects: string[];
  strongSubjects: string[];
  recommendations: Recommendation[];
}

/**
 * Get randomized assessment questions from database
 */
export async function getAssessmentQuestions(): Promise<AssessmentQuestionsResponse> {
  const response = await api.get('/assessment/questions');
  return response.data;
}

/**
 * Submit assessment answers and get grade recommendation
 */
export async function evaluateAssessment(
  answers: AnswerSubmission[]
): Promise<AssessmentEvaluationResponse> {
  const response = await api.post('/assessment/evaluate', { answers });
  return response.data;
}
