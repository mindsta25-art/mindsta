/**
 * Configuration constants for the application
 */

export const APP_CONFIG = {
  name: "Mindsta",
  version: "1.0.0",
  description: "Educational Learning Platform for Grades 1-6",
  defaultLanguage: "en",
  supportedGrades: [1, 2, 3, 4, 5, 6],
} as const;

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  GRADE: (grade: number) => `/grade/${grade}`,
  SUBJECT: (grade: number, subject: string) => `/grade/${grade}/${subject}`,
  LESSON: (grade: number, subject: string, lessonId: string) =>
    `/grade/${grade}/${subject}/lesson/${lessonId}`,
  // Admin routes
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_CONTENT: "/admin/content",
  ADMIN_LESSONS: "/admin/lessons",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

export const STORAGE_KEYS = {
  THEME: "mindsta_theme",
  USER_PREFERENCES: "mindsta_user_prefs",
  LAST_VISITED: "mindsta_last_visited",
} as const;

export const USER_TYPES = {
  STUDENT: "student",
  PARENT: "parent",
  EDUCATOR: "educator",
  ADMIN: "admin",
} as const;

export const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Arts",
  "Physical Education",
] as const;

export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: "Welcome back! Logged in successfully.",
  LOGIN_ERROR: "Failed to log in. Please check your credentials.",
  LOGOUT_SUCCESS: "Logged out successfully. See you next time!",
  SAVE_SUCCESS: "Changes saved successfully.",
  SAVE_ERROR: "Failed to save changes. Please try again.",
  DELETE_SUCCESS: "Item deleted successfully.",
  DELETE_ERROR: "Failed to delete item. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
} as const;
