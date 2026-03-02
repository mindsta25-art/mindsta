import { api } from '@/lib/apiClient';

export interface Subject {
  _id: string;
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all active subjects (public)
export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const response = await api.get('/subjects');
    if (!response) return [];
    const data = Array.isArray(response) ? response : (response.data || []);
    return data.map((s: any) => ({ ...s, id: s._id }));
  } catch (error) {
    console.error('[getSubjects] Error:', error);
    return [];
  }
};

// Get all subjects including inactive (admin only)
export const getAllSubjects = async (): Promise<Subject[]> => {
  try {
    const response = await api.get('/subjects/all');
    console.log('[getAllSubjects] Response:', response);
    
    // Handle case where response is undefined or null
    if (!response) {
      console.warn('[getAllSubjects] Empty response, returning empty array');
      return [];
    }
    
    // If response is directly an array (API client returns data directly)
    if (Array.isArray(response)) {
      return response.map((s: any) => {
        if (!s || !s._id) {
          console.warn('[getAllSubjects] Subject missing _id:', s);
          return null;
        }
        return { ...s, id: s._id };
      }).filter((s): s is Subject => s !== null);
    }
    
    // If response has a data property (wrapped response)
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((s: any) => {
        if (!s || !s._id) {
          console.warn('[getAllSubjects] Subject missing _id:', s);
          return null;
        }
        return { ...s, id: s._id };
      }).filter((s): s is Subject => s !== null);
    }
    
    console.error('[getAllSubjects] Invalid response format:', response);
    return [];
  } catch (error) {
    console.error('[getAllSubjects] Error:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
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
    
    // API client returns data directly, not wrapped in response object
    const subject = response;
    
    if (!subject) {
      console.error('[createSubject] No data in response');
      throw new Error('No data returned from server');
    }
    
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
  // API client returns data directly
  const subject = response;
  return { ...subject, id: subject._id || subject.id };
};

// Delete subject (admin only)
export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/subjects/${id}`);
  // API client returns data directly
  return response;
};

// Toggle subject active status (admin only)
export const toggleSubjectStatus = async (id: string): Promise<Subject> => {
  const response = await api.patch(`/subjects/${id}/toggle`, {});
  // API client returns data directly
  return { ...response, id: response._id || response.id };
};
