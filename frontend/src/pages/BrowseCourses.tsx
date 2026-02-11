import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { CoursePreviewDialog } from "@/components/CoursePreviewDialog";
import { ShareCourseDialog } from "@/components/ShareCourseDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Search,
  Filter,
  ShoppingCart,
  Heart,
  GraduationCap,
  Clock,
  Trophy,
  Star,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Loader2,
  Play,
  Users,
  Award,
  Zap,
  X,
  Eye,
  Grid,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Tag,
  Flame,
  ChevronDown,
  ChevronUp,
  Share2,
  MoreVertical,
  Package,
  BarChart3,
  Target,
  PlayCircle
} from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import { getTermsByGrade, getSubjectsByGrade, getLessonsBySubjectAndGrade, getLessonById, type Lesson } from "@/api/lessons";
import { getUserProgress, type UserProgress } from "@/api/progress";
import { getStudentByUserId } from "@/api";
import { getEnrollments, type Enrollment } from "@/api/enrollments";
import { getSystemSettings } from "@/api/settings";
import { formatCurrency } from "@/config/siteConfig";
import { recordSearch, getSearchKeywords } from "@/api/search-history";

interface Course {
  id: string;
  subject: string;
  grade: string;
  term: string;
  lessonCount: number;
  quizCount: number;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard' | 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  completionRate: number;
  enrolled: boolean;
  price: number;
  rating: number;
  studentCount: number;
}

const BrowseCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGrade, setSelectedGrade] = useState(searchParams.get('grade') || 'all');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all');
  const [selectedTerm, setSelectedTerm] = useState(searchParams.get('term') || 'all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical' | 'price-low' | 'price-high' | 'rating'>('popular');
  const [studentGrade, setStudentGrade] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showOnlyPurchased, setShowOnlyPurchased] = useState(false);
  const [loadedGrades, setLoadedGrades] = useState<Set<string>>(new Set());
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  
  // New state for improvements
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Course[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Smart recommendation state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [previewedCourses, setPreviewedCourses] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState<Lesson | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  const isInitialLoad = useRef(true);
  const isFetchingRef = useRef(false);

  const terms = ["First Term", "Second Term", "Third Term"];
  const grades = ["1", "2", "3", "4", "5", "6", "Common Entrance"];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Helper functions
  const isNewCourse = (lessonCount: number) => {
    // Consider courses added in last 7 days as "new" (simplified check)
    return lessonCount < 5; // Placeholder logic
  };

  const isPopular = (course: Course) => {
    const totalContent = course.lessonCount + course.quizCount;
    return totalContent > 10 || course.studentCount > 50;
  };

  const getTrendingCourses = () => {
    return courses
      .filter(c => c.studentCount > 20)
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 6);
  };

  const getRecommendedCourses = () => {
    if (courses.length === 0) return [];
    
    // Smart recommendation algorithm based on multiple factors
    const recommendedSet = new Map<string, { course: Course; score: number }>();
    
    courses.forEach(course => {
      if (course.enrolled) return; // Skip already purchased
      
      let score = 0;
      
      // Factor 1: Similar to purchased courses (30 points)
      const purchasedSubjects = courses.filter(c => c.enrolled).map(c => c.subject.toLowerCase());
      if (purchasedSubjects.some(s => course.subject.toLowerCase().includes(s) || s.includes(course.subject.toLowerCase()))) {
        score += 30;
      }
      
      // Factor 2: Related to previewed courses (25 points)
      const previewedSubjects = previewedCourses
        .map(id => courses.find(c => c.id === id)?.subject.toLowerCase())
        .filter(Boolean) as string[];
      if (previewedSubjects.some(s => course.subject.toLowerCase().includes(s) || s.includes(course.subject.toLowerCase()))) {
        score += 25;
      }
      
      // Factor 3: Matches search history - ENHANCED to search across ALL grades (40 points)
      const searchTerms = searchHistory.map(s => s.toLowerCase());
      const courseSubject = course.subject.toLowerCase();
      const courseDesc = course.description.toLowerCase();
      
      // Check if any search term matches subject or description (irrespective of grade)
      const matchesSearch = searchTerms.some(term => {
        // Split multi-word searches for better matching
        const words = term.split(/\s+/).filter(w => w.length > 2);
        return words.some(word => 
          courseSubject.includes(word) || 
          courseDesc.includes(word) ||
          // Also check if subject name contains the word
          word.includes(courseSubject) ||
          courseSubject.includes(word)
        );
      });
      
      if (matchesSearch) {
        score += 40; // Increased weight for search-based recommendations
      }
      
      // Factor 4: Popular courses (15 points)
      if (course.studentCount > 50) {
        score += 15;
      }
      
      // Factor 5: High ratings (10 points)
      if (course.rating >= 4.5) {
        score += 10;
      }
      
      // Factor 6: Same grade preference (5 points) - but don't exclude other grades
      if (course.grade === studentGrade) {
        score += 5;
      }
      
      // Factor 7: Cross-grade recommendations for advanced learners
      // If user has completed courses, recommend next grade level
      const completedInGrade = courses.filter(c => c.enrolled && c.grade === studentGrade && c.completionRate > 80).length;
      if (completedInGrade > 2) {
        const nextGrade = studentGrade === 'Common Entrance' ? '6' : 
          studentGrade === '6' ? 'Common Entrance' : 
          String(Number(studentGrade) + 1);
        if (course.grade === nextGrade) {
          score += 8;
        }
      }
      
      if (score > 0) {
        recommendedSet.set(course.id, { course, score });
      }
    });
    
    // Sort by score and return top recommendations
    return Array.from(recommendedSet.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.course);
  };

  // Debounced search with better suggestions - shows actual courses
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        const query = searchQuery.toLowerCase();
        const suggestions = courses
          .filter(c => 
            c.subject.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            c.grade.toLowerCase().includes(query) ||
            c.term.toLowerCase().includes(query)
          )
          .slice(0, 6); // Show max 6 course results
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
        
        // Track meaningful search queries (3+ characters) and save to database
        if (searchQuery.length >= 3) {
          setSearchHistory(prev => {
            const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 20);
            localStorage.setItem('searchHistory', JSON.stringify(updated));
            return updated;
          });

          // Save to database
          if (user?.id) {
            const saveSearch = async () => {
              try {
                await recordSearch(searchQuery, {
                  grade: selectedGrade !== 'all' ? selectedGrade : undefined,
                  subject: selectedSubject !== 'all' ? selectedSubject : undefined,
                  term: selectedTerm !== 'all' ? selectedTerm : undefined,
                });
              } catch (error) {
                console.error('Error saving search:', error);
              }
            };
            saveSearch();
          }
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, courses, user, selectedGrade, selectedSubject, selectedTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load search keywords from database on mount
  useEffect(() => {
    const loadSearchKeywords = async () => {
      if (!user?.id) return;
      
      try {
        const response = await getSearchKeywords();
        
        if (response && response.recentSearches) {
          // Merge database searches with local storage
          const localSearches = localStorage.getItem('searchHistory');
          const local = localSearches ? JSON.parse(localSearches) : [];
          const merged = [...new Set([...response.recentSearches, ...local])].slice(0, 50);
          
          setSearchHistory(merged);
          localStorage.setItem('searchHistory', JSON.stringify(merged));
        }
      } catch (error) {
        console.error('Error loading search keywords:', error);
        // Fallback to local storage
        const localSearches = localStorage.getItem('searchHistory');
        if (localSearches) {
          setSearchHistory(JSON.parse(localSearches));
        }
      }
    };

    loadSearchKeywords();
  }, [user]);

  // Save to recently viewed
  const addToRecentlyViewed = (courseId: string) => {
    setRecentlyViewed(prev => {
      const updated = [courseId, ...prev.filter(id => id !== courseId)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  };

  // Load user behavior data on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      setRecentlyViewed(JSON.parse(saved));
    }
    
    // Load saved filters
    const savedView = localStorage.getItem('viewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
    
    // Load search history
    const savedSearchHistory = localStorage.getItem('searchHistory');
    if (savedSearchHistory) {
      setSearchHistory(JSON.parse(savedSearchHistory));
    }
    
    // Load previewed courses
    const savedPreviewed = localStorage.getItem('previewedCourses');
    if (savedPreviewed) {
      setPreviewedCourses(JSON.parse(savedPreviewed));
    }
    
    // Extract user interests from enrollments
    if (enrollments.length > 0) {
      const interests = Array.from(new Set(enrollments.map(e => e.subject)));
      setUserInterests(interests);
    }
  }, [enrollments]);

  // Define callback functions first before useEffects
  const filterAndSortCourses = useCallback(() => {
    let filtered = [...courses];

    // Filter by purchased status
    if (showOnlyPurchased) {
      filtered = filtered.filter(course => course.enrolled);
    }

    // Apply filters
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(course => course.grade === selectedGrade);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(course => course.subject === selectedSubject);
    }

    if (selectedTerm !== 'all') {
      filtered = filtered.filter(course => course.term === selectedTerm);
    }

    // Advanced filters
    if (selectedDifficulties.length > 0) {
      filtered = filtered.filter(course => 
        selectedDifficulties.some(diff => course.difficulty.toLowerCase().includes(diff.toLowerCase()))
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter(course => course.rating >= minRating);
    }

    filtered = filtered.filter(course => 
      course.price >= priceRange[0] && course.price <= priceRange[1]
    );

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'alphabetical':
          return a.subject.localeCompare(b.subject);
        case 'newest':
          return b.lessonCount - a.lessonCount;
        case 'popular':
        default:
          return (b.lessonCount + b.quizCount) - (a.lessonCount + a.quizCount);
      }
    });

    setFilteredCourses(filtered);
  }, [courses, showOnlyPurchased, searchQuery, selectedGrade, selectedSubject, selectedTerm, sortBy, selectedDifficulties, minRating, priceRange]);

  const updateAvailableSubjects = useCallback(() => {
    // Filter courses by selected grade first, then extract unique subjects
    let coursesToCheck = [...courses];
    
    // If a specific grade is selected, only get subjects for that grade
    if (selectedGrade !== 'all') {
      coursesToCheck = coursesToCheck.filter(course => course.grade === selectedGrade);
    }
    
    // Extract unique subjects from the filtered courses
    const subjectsSet = new Set(coursesToCheck.map(course => course.subject));
    const sortedSubjects = Array.from(subjectsSet).sort();
    
    // Only update if we have subjects OR if courses are loaded
    if (sortedSubjects.length > 0 || courses.length > 0) {
      setAvailableSubjects(prev => {
        const prevStr = prev.join(',');
        const newStr = sortedSubjects.join(',');
        // Only update if actually different to prevent infinite loop
        return prevStr !== newStr ? sortedSubjects : prev;
      });
    }
    
    // Reset selected subject if it's not available in the new grade
    if (selectedSubject !== 'all' && sortedSubjects.length > 0 && !sortedSubjects.includes(selectedSubject)) {
      setSelectedSubject('all');
    }
  }, [courses, selectedGrade, selectedSubject]);

  const fetchStudentInfo = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [studentData, progress, enrollmentsData] = await Promise.all([
        getStudentByUserId(user.id),
        getUserProgress(user.id),
        getEnrollments()
      ]);
      
      console.log('[BrowseCourses] Enrollments fetched:', enrollmentsData);
      
      setStudentGrade(studentData.grade);
      // Keep selectedGrade as 'all' by default - let student choose
      // Don't auto-set to student's grade

      setUserProgress(progress);
      setEnrollments(enrollmentsData);
      
      // Fetch total registered students count
      try {
        const { api } = await import('@/lib/apiClient');
        const statsResponse = await api.get('/analytics/dashboard');
        if (statsResponse && statsResponse.totalStudents) {
          setTotalStudents(statsResponse.totalStudents);
        }
      } catch (err) {
        console.error('Error fetching total students:', err);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  }, [user?.id, selectedGrade]);

  // useEffects after function definitions
  useEffect(() => {
    // Use default items per page (settings endpoint requires admin access)
    setItemsPerPage(12);
    fetchStudentInfo();
  }, [fetchStudentInfo]);

  // Refetch enrollments when page becomes visible (e.g., after purchase)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        fetchStudentInfo();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchStudentInfo]);

  // Update course enrolled status when enrollments change
  useEffect(() => {
    if (courses.length > 0) {
      console.log('[BrowseCourses] Updating course enrollment status. Enrollments:', enrollments.length);
      
      setCourses(prevCourses => {
        const updatedCourses = prevCourses.map(course => {
          const enrolled = enrollments.some(e => 
            e.subject === course.subject && 
            e.grade === course.grade && 
            e.term === course.term
          );
          
          // Log if status changes
          if (course.enrolled !== enrolled) {
            console.log(`[BrowseCourses] Course "${course.subject}" (${course.grade}-${course.term}) enrolled status: ${course.enrolled} -> ${enrolled}`);
            return { ...course, enrolled };
          }
          return course;
        });
        
        const enrolledCount = updatedCourses.filter(c => c.enrolled).length;
        console.log(`[BrowseCourses] Total enrolled courses: ${enrolledCount}/${updatedCourses.length}`);
        
        return updatedCourses;
      });
    }
  }, [enrollments, courses.length]);

  useEffect(() => {
    // Load ALL grades on initial load for "all" filter to work
    if (enrollments.length >= 0 && loadedGrades.size === 0) {
      // Load all grades in sequence
      const loadAllGrades = async () => {
        for (const grade of grades) {
          await fetchCoursesForGrade(grade);
        }
      };
      loadAllGrades();
    }
  }, [enrollments]);

  // Separate effect for fetching courses when grade changes
  useEffect(() => {
    if (selectedGrade !== 'all' && !loadedGrades.has(selectedGrade) && loadedGrades.size > 0) {
      fetchCoursesForGrade(selectedGrade);
    }
  }, [selectedGrade]);

  useEffect(() => {
    filterAndSortCourses();
  }, [filterAndSortCourses]);

  useEffect(() => {
    updateAvailableSubjects();
  }, [updateAvailableSubjects]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCourses]);

  // Update displayed courses when page or filtered courses change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedCourses(filteredCourses.slice(startIndex, endIndex));
    
    // Scroll to top smoothly when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, filteredCourses, itemsPerPage]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGrade !== 'all') params.set('grade', selectedGrade);
    if (selectedSubject !== 'all') params.set('subject', selectedSubject);
    if (selectedTerm !== 'all') params.set('term', selectedTerm);
    setSearchParams(params);
  }, [searchQuery, selectedGrade, selectedSubject, selectedTerm, setSearchParams]);

  const fetchCoursesForGrade = async (grade: string) => {
    if (loadedGrades.has(grade) || isFetchingRef.current) return; // Already loaded or currently fetching
    
    try {
      isFetchingRef.current = true;
      setLoading(loadedGrades.size === 0); // Only show main loading on first load
      
      const gradeValue = grade === "Common Entrance" ? "Common Entrance" : grade;
      const newCourses: Course[] = [];
      const subjectsSet = new Set<string>();

      const terms = await getTermsByGrade(gradeValue);

      // Fetch all subjects for all terms in parallel
      const subjectsPromises = terms.map(term => 
        getSubjectsByGrade(gradeValue, term.name)
          .then(subjects => ({ term: term.name, subjects }))
          .catch(err => {
            console.error(`Error fetching subjects for ${gradeValue} ${term.name}:`, err);
            return { term: term.name, subjects: [] };
          })
      );

      const termSubjects = await Promise.all(subjectsPromises);

      // Fetch lessons for all subject-term combinations in parallel (with limit)
      const lessonPromises = termSubjects.flatMap(({ term, subjects }) =>
        subjects.map(subject =>
          getLessonsBySubjectAndGrade(subject.name, gradeValue, term)
            .then(lessons => ({ subject, term, lessons, gradeValue }))
            .catch(err => {
              console.error(`Error fetching lessons for ${subject.name}:`, err);
              return { subject, term, lessons: [], gradeValue };
            })
        )
      );

      const allLessons = await Promise.all(lessonPromises);

      // Process all results
      allLessons.forEach(({ subject, term, lessons, gradeValue }) => {
        if (lessons.length > 0) {
          subjectsSet.add(subject.name);
          
          const quizCount = Math.floor(lessons.length * 0.7);
          const enrolled = enrollments.some(e => 
            e.subject === subject.name && 
            e.grade === gradeValue && 
            e.term === term
          );
          
          if (enrolled) {
            console.log(`[BrowseCourses] Found enrolled course: ${subject.name} (${gradeValue}-${term})`);
          }
          
          const courseProgress = userProgress.filter(p => 
            lessons.some(l => l.id === p.lessonId)
          );
          const completedCount = courseProgress.filter(p => p.completed).length;
          const completionRate = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
          
          const validDifficulty = subject.difficulty && 
            ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard', 'Beginner', 'Intermediate', 'Advanced'].includes(subject.difficulty)
            ? subject.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard' | 'Beginner' | 'Intermediate' | 'Advanced'
            : 'beginner' as const;
          
          // Calculate total duration from all lessons in minutes
          let totalDuration = 0;
          for (const lesson of lessons) {
            totalDuration += (lesson.duration || 30);
          }
          
          newCourses.push({
            id: `${grade}-${term}-${subject.name}`,
            subject: subject.name,
            grade: grade,
            term: term,
            lessonCount: lessons.length,
            quizCount,
            description: `Master ${subject.name} concepts for ${grade === "Common Entrance" ? "Common Entrance" : `Grade ${grade}`} - ${term}. Build strong foundations and ace your tests.`,
            difficulty: validDifficulty,
            estimatedHours: Math.ceil(totalDuration / 60), // Convert minutes to hours
            completionRate,
            enrolled,
            price: subject.price || 0,
            rating: subject.rating || 0,
            studentCount: subject.enrolledStudents || 0
          });
        }
      });

      // Merge with existing subjects instead of replacing
      setAvailableSubjects(prev => {
        const merged = new Set([...prev, ...Array.from(subjectsSet)]);
        return Array.from(merged).sort();
      });
      
      // Merge courses while preserving existing enrolled status
      setCourses(prev => {
        const existingCourseMap = new Map(prev.map(c => [c.id, c]));
        const updatedCourses = [...prev];
        
        newCourses.forEach(newCourse => {
          const existing = existingCourseMap.get(newCourse.id);
          if (existing) {
            // Update existing course but preserve enrolled status if it's true
            const index = updatedCourses.findIndex(c => c.id === newCourse.id);
            updatedCourses[index] = {
              ...newCourse,
              enrolled: existing.enrolled || newCourse.enrolled, // Keep enrolled if it was previously set
            };
          } else {
            // Add new course
            updatedCourses.push(newCourse);
          }
        });
        
        return updatedCourses;
      });
      
      setLoadedGrades(prev => new Set([...prev, grade]));
      
      // Load other grades in background after initial load
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        setTimeout(() => loadRemainingGrades(grade), 100);
      }
    } catch (error) {
      console.error(`Error fetching courses for grade ${grade}:`, error);
      toast({
        title: "Error",
        description: `Failed to load courses for grade ${grade}.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const loadRemainingGrades = async (excludeGrade: string) => {
    setIsLoadingBackground(true);
    const remainingGrades = grades.filter(g => g !== excludeGrade && !loadedGrades.has(g));
    
    for (const grade of remainingGrades) {
      await fetchCoursesForGrade(grade);
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsLoadingBackground(false);
  };

  const fetchCourses = async () => {
    // Legacy function - redirect to new implementation
    if (studentGrade) {
      await fetchCoursesForGrade(studentGrade);
    } else {
      await fetchCoursesForGrade(grades[0]);
    }
  };

  const handleAddToCart = (course: Course) => {
    // Prevent adding purchased courses to cart
    if (course.enrolled) {
      toast({
        title: "Already Purchased",
        description: `You already own ${course.subject}. Go to 'My Learning' to access it.`,
        variant: "default"
      });
      return;
    }
    
    addToCart({ 
      subject: course.subject, 
      grade: course.grade, 
      term: course.term
    });
    toast({
      title: "Added to cart",
      description: `${course.subject} has been added to your cart.`
    });
  };

  const handleToggleWishlist = (course: Course) => {
    const itemId = `${course.subject}-${course.grade}-${course.term}`;
    if (isInWishlist(course.subject, course.grade, course.term)) {
      removeFromWishlist(itemId);
      toast({
        title: "Removed from wishlist",
        description: `${course.subject} has been removed from your wishlist.`
      });
    } else {
      addToWishlist({ 
        subject: course.subject, 
        grade: course.grade, 
        term: course.term
      });
      toast({
        title: "Added to wishlist",
        description: `${course.subject} has been saved to your wishlist.`
      });
    }
  };

  const handleViewCourse = (course: Course) => {
    if (course.enrolled) {
      // Navigate to course lessons if already purchased
      navigate(`/subjects/${course.grade}/${course.subject}${course.term ? `?term=${course.term}` : ''}`);
    } else {
      // Add to cart if not purchased
      handleAddToCart(course);
    }
  };

  const handlePreviewCourse = async (course: Course) => {
    setLoadingPreview(true);
    
    // Track this preview for recommendations
    setPreviewedCourses(prev => {
      const updated = [course.id, ...prev.filter(id => id !== course.id)].slice(0, 30);
      localStorage.setItem('previewedCourses', JSON.stringify(updated));
      return updated;
    });
    
    try {
      // Fetch the first lesson of the course to get full details
      const lessons = await getLessonsBySubjectAndGrade(course.subject, course.grade, course.term);
      
      if (lessons.length > 0) {
        // Fetch detailed lesson info with curriculum
        const lessonDetails = await getLessonById(lessons[0].id);
        
        if (lessonDetails) {
          setSelectedCourseForPreview(lessonDetails);
          setPreviewDialogOpen(true);
        } else {
          toast({
            title: "Preview Unavailable",
            description: "Could not load course preview. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "No Content",
          description: "This course doesn't have any lessons yet.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading course preview:', error);
      toast({
        title: "Error",
        description: "Failed to load course preview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGrade(studentGrade || 'all');
    setSelectedSubject('all');
    setSelectedTerm('all');
    setSortBy('popular');
  };

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    switch (diff) {
      case 'beginner': 
      case 'easy': 
        return 'bg-green-100 text-green-800';
      case 'intermediate': 
      case 'medium': 
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced': 
      case 'hard': 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />

      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl mt-20">
        {/* Hero Section - Redesigned */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Explore Our Course Library</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Discover Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Perfect Course
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {loading ? 'Loading amazing courses...' : `Choose from ${new Set(courses.map(c => c.subject)).size} subjects with ${courses.length}+ expertly crafted courses across all grades`}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{new Set(courses.map(c => c.subject)).size}</p>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{filteredCourses.length}</p>
                <p className="text-sm text-muted-foreground">Courses Available</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-green-600">{new Set(courses.filter(c => c.enrolled).map(c => `${c.subject}-${c.grade}`)).size}</p>
                <p className="text-sm text-muted-foreground">Enrolled Subjects</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{totalStudents.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Registered Students</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Star className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="mb-8 border-2 border-purple-100 dark:border-purple-900/30 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
            {/* Quick Filter Tabs */}
            <div className="mb-6">
              <Tabs value={showOnlyPurchased ? "purchased" : "all"} onValueChange={(v) => setShowOnlyPurchased(v === "purchased")} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-purple-100 dark:bg-purple-900/30">
                  <TabsTrigger value="all" className="text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                    All Courses ({courses.length})
                  </TabsTrigger>
                  <TabsTrigger value="purchased" className="text-base font-semibold data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    My Purchased ({courses.filter(c => c.enrolled).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Search Bar - Enhanced with Course Results */}
            <div className="relative mb-6" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5 z-10" />
              <Input
                placeholder="Search for courses, subjects, grades, or terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && searchSuggestions.length > 0 && setShowSuggestions(true)}
                className="pl-12 pr-4 h-14 text-base border-2 border-purple-100 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 overflow-hidden z-50 max-h-[500px] overflow-y-auto"
                  >
                    <div className="p-3">
                      <div className="text-xs font-semibold text-muted-foreground px-3 py-2 flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        {searchSuggestions.length} {searchSuggestions.length === 1 ? 'Result' : 'Results'} Found
                      </div>
                      <div className="space-y-2">
                        {searchSuggestions.map((course, index) => (
                          <motion.button
                            key={course.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              setShowSuggestions(false);
                              handleViewCourse(course);
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Course Icon */}
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                course.enrolled 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-purple-100 dark:bg-purple-900/30'
                              }`}>
                                <BookOpen className={`w-6 h-6 ${
                                  course.enrolled 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-purple-600 dark:text-purple-400'
                                }`} />
                              </div>
                              
                              {/* Course Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                                    {course.subject}
                                  </h4>
                                  {course.enrolled && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs flex-shrink-0">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Owned
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    <span>{course.grade === "Common Entrance" ? "Common Entrance" : `Grade ${course.grade}`}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{course.term}</span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{course.studentCount}+</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="w-3 h-3 text-purple-600" />
                                      <span>{course.lessonCount} lessons</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                      <span>{course.rating.toFixed(1)}</span>
                                    </div>
                                  </div>
                                  <span className="font-bold text-purple-600 text-sm">
                                    {formatCurrency(course.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      {searchSuggestions.length >= 6 && (
                        <div className="text-center py-2 border-t border-purple-100 dark:border-purple-900 mt-2">
                          <p className="text-xs text-muted-foreground">
                            Showing top {searchSuggestions.length} results. Use filters for more options.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  Grade Level
                </label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="h-11 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades ({courses.length})</SelectItem>
                    {grades.map((grade) => {
                      const count = courses.filter(c => c.grade === grade).length;
                      return (
                        <SelectItem key={grade} value={grade}>
                          {grade === "Common Entrance" ? "Common Entrance" : `Grade ${grade}`} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Subject
                </label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-11 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Subjects ({availableSubjects.length})
                    </SelectItem>
                    {availableSubjects.map((subject) => {
                      // Count courses for this subject in the current grade
                      const count = courses.filter(c => 
                        c.subject === subject && 
                        (selectedGrade === 'all' || c.grade === selectedGrade)
                      ).length;
                      return (
                        <SelectItem key={subject} value={subject}>
                          {subject} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  Term
                </label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-11 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {terms.map((term) => {
                      const count = courses.filter(c => 
                        c.term === term && 
                        (selectedGrade === 'all' || c.grade === selectedGrade) &&
                        (selectedSubject === 'all' || c.subject === selectedSubject)
                      ).length;
                      return (
                        <SelectItem key={term} value={term}>
                          {term} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-11 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Most Lessons</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* View Mode Toggle & Advanced Filters */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('grid');
                    localStorage.setItem('viewMode', 'grid');
                  }}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('list');
                    localStorage.setItem('viewMode', 'list');
                  }}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Advanced Filters
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border-2 border-purple-100 dark:border-purple-900/30"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                    Advanced Filters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Difficulty Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Difficulty Level</label>
                      <div className="space-y-2">
                        {['Beginner', 'Intermediate', 'Advanced'].map(diff => (
                          <label key={diff} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDifficulties.includes(diff)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDifficulties([...selectedDifficulties, diff]);
                                } else {
                                  setSelectedDifficulties(selectedDifficulties.filter(d => d !== diff));
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm">{diff}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Minimum Rating</label>
                      <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Ratings</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                          <SelectItem value="4.5">4.5+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">
                        Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="500"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>₦0</span>
                          <span>₦10,000</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clear Advanced Filters */}
                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDifficulties([]);
                        setMinRating(0);
                        setPriceRange([0, 10000]);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Advanced Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters and Clear - Redesigned */}
            <AnimatePresence>
              {(searchQuery || selectedGrade !== 'all' || selectedSubject !== 'all' || selectedTerm !== 'all' || selectedDifficulties.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-3 pt-6 border-t-2 border-purple-100 dark:border-purple-900/30"
                >
                  <span className="text-sm font-semibold text-muted-foreground">Active Filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">
                      <Search className="w-3 h-3" />
                      {searchQuery}
                      <X className="w-3 h-3 ml-1 cursor-pointer hover:text-purple-900" onClick={() => setSearchQuery('')} />
                    </Badge>
                  )}
                  {selectedGrade !== 'all' && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">
                      <GraduationCap className="w-3 h-3" />
                      {selectedGrade === "Common Entrance" ? "Common Entrance" : `Grade ${selectedGrade}`}
                      <X className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-900" onClick={() => setSelectedGrade('all')} />
                    </Badge>
                  )}
                  {selectedSubject !== 'all' && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                      <BookOpen className="w-3 h-3" />
                      {selectedSubject}
                      <X className="w-3 h-3 ml-1 cursor-pointer hover:text-green-900" onClick={() => setSelectedSubject('all')} />
                    </Badge>
                  )}
                  {selectedTerm !== 'all' && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-0">
                      <Clock className="w-3 h-3" />
                      {selectedTerm}
                      <X className="w-3 h-3 ml-1 cursor-pointer hover:text-orange-900" onClick={() => setSelectedTerm('all')} />
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="ml-auto text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    Clear All
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>

        {/* Results Count - Redesigned */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span className="text-lg font-medium">Loading amazing courses...</span>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  {filteredCourses.length === 0 ? 'No Courses Found' : 
                   filteredCourses.length === 1 ? '1 Course Available' : 
                   `${filteredCourses.length} Courses Available`}
                  {isLoadingBackground && (
                    <span title="Loading more courses in background">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    </span>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredCourses.filter(c => c.enrolled).length} enrolled • {filteredCourses.length - filteredCourses.filter(c => c.enrolled).length} available
                  {displayedCourses.length < filteredCourses.length && (
                    <> • Showing {displayedCourses.length} of {filteredCourses.length}</>
                  )}
                  {isLoadingBackground && (
                    <> • Loading more grades...</>
                  )}
                </p>
              </div>
            )}
          </div>
          {!loading && filteredCourses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-purple-300 text-purple-700">
                <Trophy className="w-3 h-3" />
                {filteredCourses.filter(c => c.enrolled).length} Enrolled
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-blue-300 text-blue-700">
                <Zap className="w-3 h-3" />
                {availableSubjects.length} Subjects
              </Badge>
            </div>
          )}
        </div>

        {/* Courses Grid - Redesigned */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-[480px] animate-pulse overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900" />
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded-lg w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 && !loading && !isLoadingBackground ? (
          // No courses in database at all
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <Card className="p-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-2 border-dashed border-gray-300 dark:border-gray-800">
              <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No Courses Available</h3>
                <p className="text-muted-foreground mb-4 text-lg">
                  There are currently no courses available in the database. Please check back later or contact support.
                </p>
                <p className="text-sm text-muted-foreground">
                  If you believe this is an error, try refreshing the page.
                </p>
              </div>
            </Card>
          </motion.div>
        ) : filteredCourses.length === 0 ? (
          // Courses exist but filters returned nothing
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <Card className="p-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-800">
              <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {searchQuery 
                    ? `No results for "${searchQuery}"` 
                    : showOnlyPurchased 
                      ? "You haven't purchased any courses yet" 
                      : "No Courses Found"}
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  {searchQuery 
                    ? `We couldn't find any courses matching "${searchQuery}". Try searching with different keywords or check your spelling.`
                    : showOnlyPurchased
                      ? "Browse our available courses and start learning today!"
                      : selectedGrade !== 'all' || selectedSubject !== 'all' || selectedTerm !== 'all'
                        ? `No courses found for ${selectedGrade !== 'all' ? `Grade ${selectedGrade}` : ''}${selectedSubject !== 'all' ? ` - ${selectedSubject}` : ''}${selectedTerm !== 'all' ? ` - ${selectedTerm}` : ''}. Try different filters.`
                        : "We couldn't find any courses matching your criteria. Try adjusting your filters."}
                </p>
                <div className="flex gap-3 justify-center">
                  {searchQuery && (
                    <Button 
                      onClick={() => setSearchQuery('')}
                      size="lg"
                      variant="outline"
                      className="border-purple-300 hover:bg-purple-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Search
                    </Button>
                  )}
                  <Button 
                    onClick={clearFilters}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showOnlyPurchased ? 'View All Courses' : 'Clear All Filters'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {displayedCourses.map((course) => (
              <motion.div
                key={course.id}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className={`h-full group overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  course.enrolled 
                    ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 ring-2 ring-green-200 dark:ring-green-900/50' 
                    : 'border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20'
                }`}>
                  {/* Course Header with Gradient */}
                  <div className={`relative h-40 overflow-hidden ${
                    course.enrolled 
                      ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500' 
                      : 'bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500'
                  }`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                    
                    {/* Top Left Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isNewCourse(course.lessonCount) && !course.enrolled && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                          <Sparkles className="w-3 h-3 mr-1" />
                          NEW
                        </Badge>
                      )}
                      {isPopular(course) && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg">
                          <Flame className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    
                    {/* Purchased Ribbon - Top Right Corner */}
                    {course.enrolled && (
                      <div className="absolute top-0 right-0 z-20">
                        <div className="bg-green-600 text-white px-5 py-2 shadow-lg flex items-center gap-2 font-bold text-sm rounded-bl-lg">
                          <CheckCircle className="w-4 h-4" />
                          PURCHASED
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Wishlist Button - Only show if not enrolled */}
                    {!course.enrolled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(course);
                        }}
                      >
                        <Heart
                          className={`w-5 h-5 transition-all ${
                            isInWishlist(course.subject, course.grade, course.term)
                              ? 'fill-red-500 text-red-500 scale-110'
                              : 'text-gray-600 hover:text-red-500 hover:scale-110'
                          }`}
                        />
                      </Button>
                    )}

                    {/* Badges */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                      <Badge className={`${getDifficultyColor(course.difficulty)} shadow-md font-semibold`}>
                        {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1).toLowerCase()}
                      </Badge>
                      {course.enrolled && (
                        <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg font-bold text-sm px-4 py-1.5 animate-pulse">
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          PURCHASED
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="pb-3 pt-5">
                    <div className="cursor-pointer" onClick={() => handleViewCourse(course)}>
                      <CardTitle className="text-xl font-bold group-hover:text-purple-600 transition-colors line-clamp-2 mb-3">
                        {course.subject}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">
                            {course.grade === "Common Entrance" ? "Common Entrance" : `Grade ${course.grade}`}
                          </span>
                        </div>
                        <span>•</span>
                        <span className="font-medium">{course.term}</span>
                      </div>
                    </div>

                    {/* Progress Bar for Enrolled Courses */}
                    {course.enrolled && course.completionRate > 0 && (
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-purple-600">Progress</span>
                          <span className="font-bold">{course.completionRate}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 pb-5 flex flex-col gap-4">
                    {/* Course Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-950/30 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{course.lessonCount}</p>
                          <p className="text-xs text-muted-foreground">Lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{course.quizCount}</p>
                          <p className="text-xs text-muted-foreground">Quizzes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {course.estimatedHours > 0 ? `${course.estimatedHours}h` : '30m'}
                          </p>
                          <p className="text-xs text-muted-foreground">Duration</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{course.rating}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                    </div>

                    {/* Price and Student Count */}
                    <div className="flex items-center justify-between py-3 border-t border-purple-100 dark:border-purple-900/30">
                      <div>
                        {course.enrolled ? (
                          <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Purchased
                          </p>
                        ) : (
                          <p className="text-2xl font-bold text-purple-600">{formatCurrency(course.price)}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          {course.studentCount}+ students
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(course.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {course.enrolled ? (
                        <>
                          <Button 
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                            onClick={() => handleViewCourse(course)}
                          >
                            <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            Start Learning
                          </Button>
                          <ShareCourseDialog
                            course={{
                              subject: course.subject,
                              grade: course.grade,
                              term: course.term,
                              price: course.price,
                              description: course.description
                            }}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Share2 className="w-3 h-3 mr-2" />
                                Share
                              </Button>
                            }
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              className="flex-1 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-900 dark:hover:text-purple-100"
                              onClick={() => handlePreviewCourse(course)}
                              disabled={loadingPreview}
                            >
                              {loadingPreview ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4 mr-2" />
                              )}
                              Preview
                            </Button>
                            {course.enrolled ? (
                              <Button 
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group font-bold"
                                onClick={() => navigate(`/subjects/${course.grade}/${course.subject}${course.term ? `?term=${course.term}` : ''}`)}
                              >
                                <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                Start Course
                              </Button>
                            ) : (
                              <Button 
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                                onClick={() => handleAddToCart(course)}
                                disabled={isInCart(course.subject, course.grade, course.term)}
                              >
                                {isInCart(course.subject, course.grade, course.term) ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    In Cart
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <ShareCourseDialog
                            course={{
                              subject: course.subject,
                              grade: course.grade,
                              term: course.term,
                              price: course.price,
                              description: course.description
                            }}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-xs">
                                <Share2 className="w-3 h-3 mr-2" />
                                Share Course
                              </Button>
                            }
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredCourses.length > 0 && (
          <div className="flex justify-center items-center gap-2 py-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {(() => {
                const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
                const pages = [];
                const maxVisible = 7;
                
                if (totalPages <= maxVisible) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show smart pagination with ellipsis
                  if (currentPage <= 4) {
                    // Near start
                    for (let i = 1; i <= 5; i++) pages.push(i);
                    pages.push(-1); // ellipsis
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    // Near end
                    pages.push(1);
                    pages.push(-1); // ellipsis
                    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                  } else {
                    // Middle
                    pages.push(1);
                    pages.push(-1); // ellipsis
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                    pages.push(-2); // ellipsis
                    pages.push(totalPages);
                  }
                }
                
                return pages.map((page, idx) => {
                  if (page === -1 || page === -2) {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" : ""}
                    >
                      {page}
                    </Button>
                  );
                });
              })()}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCourses.length / itemsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(filteredCourses.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredCourses.length > 0 && (
          <div className="text-center pb-8">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
            </p>
          </div>
        )}

        {/* Trending Now Section - Now below main courses */}
        {!loading && !showOnlyPurchased && getTrendingCourses().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Trending Now</h2>
                <p className="text-sm text-muted-foreground">Most popular courses this week</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTrendingCourses().map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-2 border-orange-100 dark:border-orange-900/30 relative overflow-hidden">
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                        <Flame className="w-3 h-3 mr-1" />
                        #{index + 1} Trending
                      </Badge>
                    </div>
                    <div className="h-32 bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 dark:from-orange-950 dark:via-red-950 dark:to-pink-950 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 className="w-16 h-16 text-orange-400 opacity-50" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{course.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        <span>{course.studentCount}+ students enrolled</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-purple-600">{formatCurrency(course.price)}</span>
                        <Button 
                          size="sm" 
                          className={course.enrolled ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold" : ""}
                          onClick={() => {
                            if (course.enrolled) {
                              navigate(`/subjects/${course.grade}/${course.subject}${course.term ? `?term=${course.term}` : ''}`);
                            } else if (!isInCart(course.subject, course.grade, course.term)) {
                              handleAddToCart(course);
                            } else {
                              navigate('/cart');
                            }
                          }}
                        >
                          {course.enrolled ? (
                            <>
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Start Course
                            </>
                          ) : isInCart(course.subject, course.grade, course.term) ? (
                            'In Cart'
                          ) : (
                            'Add to Cart'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommended for You Section - Professional UI/UX */}
        {!loading && getRecommendedCourses().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            {/* Section Header */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-pink-950/20 rounded-2xl blur-xl opacity-50"></div>
              <Card className="relative border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-pink-950/30 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl blur opacity-50"></div>
                        <div className="relative p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                          Recommended for You
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Based on your interests, searches, and learning goals
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-2 text-sm">
                      {getRecommendedCourses().length} Courses
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Course Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {getRecommendedCourses().map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 dark:border-purple-900/30 group overflow-hidden bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20">
                    {/* Course Header */}
                    <div className="relative h-32 bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400 overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-2 right-2">
                        <div className="w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <div className="w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                      </div>
                      
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-purple-700 border-0 shadow-lg text-xs font-semibold">
                          <Sparkles className="w-3 h-3 mr-1" />
                          For You
                        </Badge>
                      </div>
                    </div>

                    {/* Course Content */}
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {course.subject}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{course.grade === "Common Entrance" ? "Common Entrance" : `Grade ${course.grade}`}</span>
                          <span>•</span>
                          <span>{course.term}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs bg-purple-50 dark:bg-purple-950/30 p-2 rounded-lg">
                          <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold">{course.lessonCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold">{course.studentCount}+</span>
                        </div>
                      </div>

                      {/* Rating and Price */}
                      <div className="flex items-center justify-between pt-2 border-t border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(course.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-semibold ml-1">{course.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">{formatCurrency(course.price)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 hover:text-purple-700 dark:hover:text-purple-300" 
                          onClick={() => handlePreviewCourse(course)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                          onClick={() => handleAddToCart(course)}
                          disabled={isInCart(course.subject, course.grade, course.term)}
                        >
                          {isInCart(course.subject, course.grade, course.term) ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              In Cart
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <StudentFooter />

      {/* Floating Wishlist Button */}
      <AnimatePresence>
        {courses.filter(c => isInWishlist(c.subject, c.grade, c.term)).length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-2xl"
              onClick={() => navigate('/wishlist')}
            >
              <div className="relative">
                <Heart className="w-6 h-6 fill-white text-white" />
                <Badge className="absolute -top-2 -right-2 bg-white text-pink-600 border-0 text-xs px-1.5 min-w-[20px] h-5">
                  {courses.filter(c => isInWishlist(c.subject, c.grade, c.term)).length}
                </Badge>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Preview Dialog */}
      <CoursePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        course={selectedCourseForPreview}
        onAddToCart={() => {
          if (selectedCourseForPreview) {
            addToCart({
              subject: selectedCourseForPreview.subject,
              grade: selectedCourseForPreview.grade,
              term: selectedCourseForPreview.term
            });
            toast({
              title: "Added to cart",
              description: `${selectedCourseForPreview.title} has been added to your cart.`
            });
          }
        }}
        isEnrolled={selectedCourseForPreview ? enrollments.some(e =>
          e.subject === selectedCourseForPreview.subject &&
          e.grade === selectedCourseForPreview.grade &&
          e.term === selectedCourseForPreview.term
        ) : false}
        isInCart={selectedCourseForPreview ? isInCart(
          selectedCourseForPreview.subject,
          selectedCourseForPreview.grade,
          selectedCourseForPreview.term
        ) : false}
      />
    </div>
  );
};

export default BrowseCourses;
