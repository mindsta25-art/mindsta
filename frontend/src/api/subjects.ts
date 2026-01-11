import { apiClient } from './index';

export interface Subject {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Get all active subjects
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get('/subjects');
  return response.data;
};

// Get all subjects (including inactive) - Admin only
export const getAllSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get('/subjects/all');
  return response.data;
};

// Get a single subject by ID
export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get(`/subjects/${id}`);
  return response.data;
};

// Create a new subject - Admin only
export const createSubject = async (subject: Partial<Subject>): Promise<Subject> => {
  const response = await apiClient.post('/subjects', subject);
  return response.data.subject;
};

// Update a subject - Admin only
export const updateSubject = async (id: string, subject: Partial<Subject>): Promise<Subject> => {
  const response = await apiClient.put(`/subjects/${id}`, subject);
  return response.data.subject;
};

// Delete (deactivate) a subject - Admin only
export const deleteSubject = async (id: string): Promise<void> => {
  await apiClient.delete(`/subjects/${id}`);
};

// Permanently delete a subject - Admin only
export const permanentlyDeleteSubject = async (id: string): Promise<void> => {
  await apiClient.delete(`/subjects/${id}/permanent`);
};
