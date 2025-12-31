/**
 * Custom hook for managing subjects and grade/term selection
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getTermsByGrade,
  getSubjectsByGrade,
  getLessons,
  type TermInfo,
  type SubjectInfo,
  type Lesson
} from '@/api/lessons';
import { SUBJECTS_PER_PAGE } from '../utils/constants';

export const useSubjects = (initialGrade?: string) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade || '');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [availableTerms, setAvailableTerms] = useState<TermInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [displayedSubjects, setDisplayedSubjects] = useState<SubjectInfo[]>([]);
  const [allGradeLessons, setAllGradeLessons] = useState<Lesson[]>([]);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [hasMoreSubjects, setHasMoreSubjects] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const { toast } = useToast();

  // Fetch terms and lessons when grade changes
  useEffect(() => {
    const fetchTerms = async () => {
      if (!selectedGrade) return;

      try {
        setLoadingTerms(true);
        const terms = await getTermsByGrade(selectedGrade);
        setAvailableTerms(terms);
        
        // Reset term and subjects when grade changes
        setSelectedTerm('');
        setSubjects([]);
        setLoadingTerms(false);
        
        // Fetch all lessons for stats/progress in background
        getLessons(undefined, selectedGrade)
          .then(lessons => setAllGradeLessons(lessons))
          .catch(error => console.error('Error fetching lessons:', error));
      } catch (error) {
        console.error('Error fetching terms:', error);
        toast({
          title: 'Error',
          description: 'Failed to load terms. Please try again.',
          variant: 'destructive',
        });
        setLoadingTerms(false);
      }
    };

    fetchTerms();
  }, [selectedGrade, toast]);

  // Fetch subjects when term changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedGrade || !selectedTerm) return;

      try {
        setLoadingSubjects(true);
        const data = await getSubjectsByGrade(selectedGrade, selectedTerm);
        setSubjects(data);
        
        // Reset pagination
        setSubjectsPage(1);
        setDisplayedSubjects(data.slice(0, SUBJECTS_PER_PAGE));
        setHasMoreSubjects(data.length > SUBJECTS_PER_PAGE);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subjects. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selectedGrade, selectedTerm, toast]);

  // Load more subjects for infinite scroll
  const loadMoreSubjects = useCallback(() => {
    if (!hasMoreSubjects || loadingSubjects) return;

    const startIndex = subjectsPage * SUBJECTS_PER_PAGE;
    const endIndex = startIndex + SUBJECTS_PER_PAGE;
    const newSubjects = subjects.slice(startIndex, endIndex);

    if (newSubjects.length > 0) {
      setDisplayedSubjects(prev => [...prev, ...newSubjects]);
      setSubjectsPage(prev => prev + 1);
      setHasMoreSubjects(endIndex < subjects.length);
    } else {
      setHasMoreSubjects(false);
    }
  }, [subjects, subjectsPage, hasMoreSubjects, loadingSubjects]);

  return {
    selectedGrade,
    setSelectedGrade,
    selectedTerm,
    setSelectedTerm,
    availableTerms,
    subjects,
    displayedSubjects,
    allGradeLessons,
    hasMoreSubjects,
    loadMoreSubjects,
    loadingTerms,
    loadingSubjects
  };
};
