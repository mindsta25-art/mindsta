import { api } from '@/lib/apiClient';

export interface Topic {
  id: string;
  _id?: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  term: string;
  lessons: any[];
  price: number;
  discountPercentage: number;
  order: number;
  duration: number;
  difficulty: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  learningOutcomes: string[];
  keywords: string[];
  isActive: boolean;
  isPublished: boolean;
  enrolledStudents: number;
  completedStudents: number;
  rating: number;
  ratingsCount: number;
  slug: string;
  lessonsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TopicFilters {
  grades: string[];
  terms: string[];
  subjects: string[];
}

/**
 * Get all topics with optional filtering
 */
export const getTopics = async (filters?: {
  subject?: string;
  grade?: string;
  term?: string;
  isPublished?: boolean;
}): Promise<Topic[]> => {
  const params = new URLSearchParams();
  if (filters?.subject) params.append('subject', filters.subject);
  if (filters?.grade) params.append('grade', filters.grade);
  if (filters?.term) params.append('term', filters.term);
  if (filters?.isPublished !== undefined) params.append('isPublished', String(filters.isPublished));
  
  const response = await api.get(`/topics?${params.toString()}`);
  return response.data;
};

/**
 * Get available filter options
 */
export const getTopicFilters = async (): Promise<TopicFilters> => {
  const response = await api.get('/topics/filters');
  return response.data;
};

/**
 * Get single topic by ID
 */
export const getTopicById = async (id: string): Promise<Topic> => {
  const response = await api.get(`/topics/${id}`);
  return response.data;
};

/**
 * Get topic by slug
 */
export const getTopicBySlug = async (slug: string): Promise<Topic> => {
  const response = await api.get(`/topics/slug/${slug}`);
  return response.data;
};

/**
 * Create new topic (admin only)
 */
export const createTopic = async (topicData: Partial<Topic>): Promise<Topic> => {
  const response = await api.post('/topics', topicData);
  return response.data;
};

/**
 * Update topic (admin only)
 */
export const updateTopic = async (id: string, topicData: Partial<Topic>): Promise<Topic> => {
  const response = await api.put(`/topics/${id}`, topicData);
  return response.data;
};

/**
 * Delete topic (admin only)
 */
export const deleteTopic = async (id: string): Promise<void> => {
  await api.delete(`/topics/${id}`);
};

/**
 * Add lessons to topic (admin only)
 */
export const addLessonsToTopic = async (topicId: string, lessonIds: string[]): Promise<Topic> => {
  const response = await api.post(`/topics/${topicId}/lessons`, { lessonIds });
  return response.data;
};

/**
 * Remove lesson from topic (admin only)
 */
export const removeLessonFromTopic = async (topicId: string, lessonId: string): Promise<Topic> => {
  const response = await api.delete(`/topics/${topicId}/lessons/${lessonId}`);
  return response.data;
};

/**
 * Add topic to cart
 */
export const addTopicToCart = async (topicId: string) => {
  const response = await api.post('/cart/add-topic', { topicId });
  return response.data;
};

/**
 * Add lesson to cart
 */
export const addLessonToCart = async (lessonId: string) => {
  const response = await api.post('/cart/add-lesson', { lessonId });
  return response.data;
};
