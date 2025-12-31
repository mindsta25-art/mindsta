/**
 * Students API (MongoDB via Node.js Backend)
 * Handles student-related operations
 */

import { api } from '@/lib/apiClient';

export interface StudentData {
  id: string;
  userId: string;
  fullName: string;
  grade: string;
  age: number;
  schoolName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get student by user ID
 */
export const getStudentByUserId = async (userId: string): Promise<StudentData | null> => {
  try {
    const result = await api.get(`/students/${userId}`);
    return result;
  } catch (error) {
    console.error('Error fetching student:', error);
    return null;
  }
};

/**
 * Get all students
 */
export const getAllStudents = async (): Promise<StudentData[]> => {
  try {
    const result = await api.get('/students');
    return result;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

/**
 * Update student grade
 */
export const updateStudentGrade = async (userId: string, grade: string): Promise<StudentData | null> => {
  try {
    const result = await api.put(`/students/${userId}/grade`, { grade });
    return result;
  } catch (error) {
    console.error('Error updating student grade:', error);
    return null;
  }
};

/**
 * Update student profile
 */
export const updateStudentProfile = async (
  userId: string, 
  data: { fullName?: string; age?: number; grade?: string; schoolName?: string }
): Promise<StudentData | null> => {
  try {
    const result = await api.put(`/students/${userId}/profile`, data);
    return result;
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};
