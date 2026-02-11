import { api } from '@/lib/apiClient';

export interface CourseReview {
  id: string;
  _id?: string;
  userId: string;
  studentName: string;
  subject: string;
  grade: string;
  term?: string;
  rating: number;
  review: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * Get reviews for a course (subject + grade + term)
 */
export const getCourseReviews = async (
  subject: string,
  grade: string,
  term?: string
): Promise<CourseReview[]> => {
  try {
    const params = new URLSearchParams();
    params.append('subject', subject);
    params.append('grade', grade);
    if (term) params.append('term', term);
    
    const result = await api.get(`/course-reviews?${params.toString()}`);
    return result;
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    return [];
  }
};

/**
 * Get review stats for a course
 */
export const getReviewStats = async (
  subject: string,
  grade: string,
  term?: string
): Promise<ReviewStats> => {
  try {
    const params = new URLSearchParams();
    params.append('subject', subject);
    params.append('grade', grade);
    if (term) params.append('term', term);
    
    const result = await api.get(`/course-reviews/stats?${params.toString()}`);
    return result;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
};

/**
 * Create a new course review
 */
export const createCourseReview = async (
  reviewData: {
    subject: string;
    grade: string;
    term?: string;
    rating: number;
    review: string;
  }
): Promise<CourseReview> => {
  const result = await api.post('/course-reviews', reviewData);
  return result;
};

/**
 * Update a course review
 */
export const updateCourseReview = async (
  id: string,
  reviewData: {
    rating?: number;
    review?: string;
  }
): Promise<CourseReview> => {
  const result = await api.put(`/course-reviews/${id}`, reviewData);
  return result;
};

/**
 * Delete a course review
 */
export const deleteCourseReview = async (id: string): Promise<void> => {
  await api.delete(`/course-reviews/${id}`);
};

/**
 * Mark review as helpful/not helpful
 */
export const markReviewHelpful = async (
  id: string,
  helpful: boolean
): Promise<CourseReview> => {
  const result = await api.post(`/course-reviews/${id}/helpful`, { helpful });
  return result;
};
