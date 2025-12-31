import { api } from '@/lib/apiClient';

// Get all reviews for a lesson
export const getReviews = async (
  lessonId: string, 
  options?: {
    rating?: number;
    sortBy?: 'helpful' | 'recent' | 'highest' | 'lowest';
    page?: number;
    limit?: number;
  }
) => {
  const params = new URLSearchParams();
  if (options?.rating) params.append('rating', options.rating.toString());
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const response = await api.get(`/reviews/lesson/${lessonId}?${params.toString()}`);
  return response.data;
};

// Get rating statistics for a lesson
export const getRatingStats = async (lessonId: string) => {
  const response = await api.get(`/reviews/lesson/${lessonId}/stats`);
  return response.data;
};

// Get user's review for a lesson
export const getMyReview = async (lessonId: string) => {
  const response = await api.get(`/reviews/lesson/${lessonId}/my-review`);
  return response.data;
};

// Create or update a review
export const submitReview = async (
  lessonId: string,
  reviewData: {
    rating: number;
    title: string;
    comment: string;
  }
) => {
  const response = await api.post(`/reviews/lesson/${lessonId}`, reviewData);
  return response.data;
};

// Update a review
export const updateReview = async (
  reviewId: string,
  reviewData: {
    rating?: number;
    title?: string;
    comment?: string;
  }
) => {
  const response = await api.put(`/reviews/${reviewId}`, reviewData);
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId: string) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

// Mark review as helpful
export const markReviewHelpful = async (reviewId: string) => {
  const response = await api.post(`/reviews/${reviewId}/helpful`, {});
  return response.data;
};

// Add instructor response to a review
export const addInstructorResponse = async (
  reviewId: string,
  comment: string
) => {
  const response = await api.post(`/reviews/${reviewId}/response`, { comment });
  return response.data;
};

// Admin: Get all reviews
export const getAllReviews = async (options?: {
  status?: 'active' | 'hidden' | 'flagged';
  rating?: number;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.rating) params.append('rating', options.rating.toString());
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const response = await api.get(`/reviews/admin/all?${params.toString()}`);
  return response.data;
};

// Admin: Update review status
export const updateReviewStatus = async (
  reviewId: string,
  status: 'active' | 'hidden' | 'flagged'
) => {
  const response = await api.patch(`/reviews/admin/${reviewId}/status`, { status });
  return response.data;
};

export interface Review {
  _id: string;
  lessonId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  helpfulCount: number;
  helpfulBy: string[];
  instructorResponse?: {
    comment: string;
    respondedAt: string;
    respondedBy: string;
  };
  status: 'active' | 'hidden' | 'flagged';
  isVerifiedPurchase: boolean;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
