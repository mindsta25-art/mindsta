import { api } from '@/lib/apiClient';

export interface Suggestion {
  _id?: string;
  topic: string;
  description?: string;
  subject?: string;
  grade?: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSuggestionDto {
  topic: string;
  description?: string;
  subject?: string;
  grade?: string;
}

export interface UpdateSuggestionDto {
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  adminNotes?: string;
}

export const submitSuggestion = async (suggestion: CreateSuggestionDto) => {
  const response = await api.post('/suggestions', suggestion);
  return response;
};

export const getAllSuggestions = async (filters?: {
  status?: string;
  grade?: string;
  subject?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.grade) params.append('grade', filters.grade);
  if (filters?.subject) params.append('subject', filters.subject);
  
  const response = await api.get(`/suggestions?${params.toString()}`);
  return response as Suggestion[];
};

export const getMySuggestions = async () => {
  const response = await api.get('/suggestions/my');
  return response as Suggestion[];
};

export const updateSuggestion = async (id: string, data: UpdateSuggestionDto) => {
  const response = await api.patch(`/suggestions/${id}`, data);
  return response;
};

export const deleteSuggestion = async (id: string) => {
  const response = await api.delete(`/suggestions/${id}`);
  return response;
};
