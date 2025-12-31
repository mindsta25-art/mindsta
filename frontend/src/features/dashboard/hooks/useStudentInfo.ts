/**
 * Custom hook for managing student information
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStudentByUserId } from '@/api';

export interface StudentInfo {
  fullName: string;
  grade: string;
  schoolName: string;
}

export const useStudentInfo = (userId?: string) => {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getStudentByUserId(userId);

        if (!data) {
          throw new Error('Failed to fetch student information');
        }

        setStudentInfo({
          fullName: data.fullName,
          grade: data.grade,
          schoolName: data.schoolName,
        });
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error fetching student info:', error);
        
        toast({
          title: 'Error',
          description: 'Failed to load student information. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentInfo();
  }, [userId, toast]);

  return { studentInfo, isLoading, error, setStudentInfo };
};
