/**
 * Search History API
 * Functions for managing user search history and recommendations
 */

import { api } from '@/lib/apiClient';

export interface SearchHistoryRecord {
  id: string;
  query: string;
  searchCount: number;
  lastSearchedAt: string;
}

export interface SearchKeywordsResponse {
  keywords: string[];
  recentSearches: string[];
}

/**
 * Record a search query
 */
export const recordSearch = async (query: string, filters?: {
  grade?: string;
  subject?: string;
  term?: string;
}): Promise<SearchHistoryRecord> => {
  return api.post('/search-history', { query, filters });
};

/**
 * Get user's search history
 */
export const getSearchHistory = async (limit = 50): Promise<SearchHistoryRecord[]> => {
  return api.get(`/search-history?limit=${limit}`);
};

/**
 * Get search keywords for recommendations
 */
export const getSearchKeywords = async (): Promise<SearchKeywordsResponse> => {
  return api.get('/search-history/keywords');
};

/**
 * Record that user clicked on a search result
 */
export const recordSearchClick = async (
  searchId: string,
  course: { subject: string; grade: string; term: string }
): Promise<{ success: boolean }> => {
  return api.put(`/search-history/${searchId}/click`, course);
};

/**
 * Get popular searches across all users
 */
export const getPopularSearches = async (limit = 20): Promise<Array<{
  query: string;
  totalSearches: number;
  userCount: number;
}>> => {
  return api.get(`/search-history/popular?limit=${limit}`);
};

/**
 * Clear user's search history
 */
export const clearSearchHistory = async (): Promise<{ message: string }> => {
  return api.delete('/search-history');
};
