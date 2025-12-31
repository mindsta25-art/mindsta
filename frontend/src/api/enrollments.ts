/**
 * Enrollments API
 * Handles course enrollment/access checks
 */
import { api } from '@/lib/apiClient';

export interface Enrollment {
  _id: string;
  userId: string;
  subject: string;
  grade: string;
  term?: string;
  paymentId: string;
  purchasePrice: number;
  purchasedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getEnrollments = async (): Promise<Enrollment[]> => {
  return api.get('/enrollments');
};

export const checkAccess = async (subject: string, grade: string, term?: string): Promise<{ hasAccess: boolean; enrollment?: Enrollment }> => {
  const params = new URLSearchParams({ subject, grade });
  if (term) params.append('term', term);
  return api.get(`/enrollments/check?${params.toString()}`);
};
