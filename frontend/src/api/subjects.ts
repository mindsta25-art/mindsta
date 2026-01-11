import { apiClient } from '@/lib/apiClient';

export interface Subject {
  _id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Get all active subjects (public)
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get('/subjects');
  return response.data;
};

// Get all subjects including inactive (admin only)
export const getAllSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get('/subjects/all');
  return response.data;
};

// Get single subject
export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await apiClient.get(`/subjects/${id}`);
  return response.data;
};

// Create new subject (admin only)
export const createSubject = async (data: Partial<Subject>): Promise<Subject> => {
  const response = await apiClient.post('/subjects', data);
  return response.data;
};

// Update subject (admin only)
export const updateSubject = async (id: string, data: Partial<Subject>): Promise<Subject> => {
  const response = await apiClient.put(`/subjects/${id}`, data);
  return response.data;
};

// Delete subject (admin only)
export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
};

// Toggle subject active status (admin only)
export const toggleSubjectStatus = async (id: string): Promise<Subject> => {
  const response = await apiClient.patch(`/subjects/${id}/toggle`);
  return response.data;
};
