import { api } from '@/lib/apiClient';

export interface Subject {
  _id: string;
  id: string;
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
  const response = await api.get('/subjects');
  return response.data.map((s: any) => ({ ...s, id: s._id }));
};

// Get all subjects including inactive (admin only)
export const getAllSubjects = async (): Promise<Subject[]> => {
  try {
    const response = await api.get('/subjects/all');
    console.log('[getAllSubjects] Response:', response.data);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[getAllSubjects] Invalid response format:', response.data);
      return [];
    }
    
    return response.data.map((s: any) => {
      if (!s || !s._id) {
        console.warn('[getAllSubjects] Subject missing _id:', s);
        return null;
      }
      return { ...s, id: s._id };
    }).filter((s): s is Subject => s !== null);
  } catch (error) {
    console.error('[getAllSubjects] Error:', error);
    throw error;
  }
};

// Get single subject
export const getSubjectById = async (id: string): Promise<Subject> => {
  const response = await api.get(`/subjects/${id}`);
  return { ...response.data, id: response.data._id };
};

// Create new subject (admin only)
export const createSubject = async (data: Partial<Subject>): Promise<Subject> => {
  try {
    console.log('[createSubject] Sending data:', data);
    const response = await api.post('/subjects', data);
    console.log('[createSubject] Full response:', response);
    console.log('[createSubject] Response data:', response.data);
    console.log('[createSubject] Response status:', response.status);
    
    if (!response || response.status !== 201) {
      console.error('[createSubject] Unexpected response status:', response?.status);
    }
    
    if (!response.data) {
      console.error('[createSubject] No data in response');
      throw new Error('No data returned from server');
    }
    
    const subject = response.data;
    if (!subject._id && !subject.id) {
      console.error('[createSubject] Subject missing ID:', subject);
      throw new Error('Invalid subject data returned');
    }
    
    return { ...subject, id: subject._id || subject.id };
  } catch (error: any) {
    console.error('[createSubject] Full error object:', error);
    console.error('[createSubject] Error response:', error.response);
    console.error('[createSubject] Error message:', error.message);
    throw error;
  }
};

// Update subject (admin only)
export const updateSubject = async (id: string, data: Partial<Subject>): Promise<Subject> => {
  const response = await api.put(`/subjects/${id}`, data);
  const subject = response.data;
  return { ...subject, id: subject._id || subject.id };
};

// Delete subject (admin only)
export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
};

// Toggle subject active status (admin only)
export const toggleSubjectStatus = async (id: string): Promise<Subject> => {
  const response = await api.patch(`/subjects/${id}/toggle`, {});
  return { ...response.data, id: response.data._id };
};
