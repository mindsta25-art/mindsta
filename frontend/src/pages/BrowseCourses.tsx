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
  MoreVertical,
  Package,
  BarChart3,
  Target,
  PlayCircle,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
  ShoppingBag,
  BadgeCheck,
  ArrowRight,
  Minus,
  Plus
} from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import { isEnrolled as isEnrolledUtil } from "@/utils/enrollmentUtils";
import { getTermsByGrade, getSubjectsByGrade, getLessonsBySubjectAndGrade, getLessonById, type Lesson } from "@/api/lessons";
import { getQuizzesByFilters } from "@/api/quizzes";
import { getUserProgress, type UserProgress } from "@/api/progress";
import { getStudentByUserId } from "@/api";
import { getEnrollments, type Enrollment } from "@/api/enrollments";
import { getSystemSettings } from "@/api/settings";
import { formatCurrency } from "@/config/siteConfig";
import { recordSearch, getSearchKeywords } from "@/api/search-history";
import { getReviewStats } from "@/api/courseReviews";

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
  durationDisplay: string; // e.g. "2h" or "45m"
  completionRate: number;
  enrolled: boolean;
  price: number;
  imageUrl?: string;
  thumbnail?: string;
  rating: number;
  studentCount: number;
  topics: string[];     // lesson titles for topic-level search
  lessonIds: string[]; // lesson IDs for "continue where you left off"
  reviewCount: number; // number of reviews
}

// Subject → category mapping
// Color palette cycling for dynamic subject category tiles
const CATEGORY_COLOR_PALETTE: string[] = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-violet-500',
  'from-teal-500 to-cyan-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-fuchsia-500',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-violet-500 to-purple-600',
];

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
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    // Seed from localStorage cache so the FIRST render already has correct enrolled flags
    // (prevents the stale-closure downgrade from fetchCoursesForGrade)
    try {
      const cached = localStorage.getItem('user_enrollments');
      return cached ? (JSON.parse(cached) as Enrollment[]) : [];
    } catch {
      return [];
    }
  });
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Smart recommendation state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [previewedCourses, setPreviewedCourses] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  // Topic + free-only filter state
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || '');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Sidebar category filter
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Students also bought — shown after adding a course to cart
  const [justAddedCourse, setJustAddedCourse] = useState<Course | null>(null);
  const [showAlsoBought, setShowAlsoBought] = useState(false);
  const [alsoBoughtCountdown, setAlsoBoughtCountdown] = useState(15);
  const alsoBoughtTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Review rating cache: courseId → { avgRating, totalReviews }
  const [reviewCache, setReviewCache] = useState<Record<string, { avg: number; total: number }>>({});
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState<Lesson | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  // Enrollment counts per subject-grade-term (for student count display)
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const enrollmentCountsRef = useRef<Record<string, number>>({});

  const isInitialLoad = useRef(true);
  const isFetchingRef = useRef(false);
  // Always-current enrollment ref — used inside fetchCoursesForGrade to avoid stale closures
  const enrollmentsRef = useRef<Enrollment[]>((() => {
    try {
      const cached = localStorage.getItem('user_enrollments');
      return cached ? (JSON.parse(cached) as Enrollment[]) : [];
    } catch { return []; }
  })());

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

  // Returns enriched recommendation objects with reason labels
  const getRecommendedCourses = (): Array<{ course: Course; score: number; reason: string; reasonType: 'search' | 'enrolled' | 'previewed' | 'popular' | 'grade' | 'trending' }> => {
    if (courses.length === 0) return [];

    const recommendedSet = new Map<string, { course: Course; score: number; reason: string; reasonType: 'search' | 'enrolled' | 'previewed' | 'popular' | 'grade' | 'trending' }>();

    courses.forEach(course => {
      if (course.enrolled) return;

      let score = 0;
      let topReason = '';
      let topReasonType: 'search' | 'enrolled' | 'previewed' | 'popular' | 'grade' | 'trending' = 'popular';

      const purchasedSubjects = courses.filter(c => c.enrolled).map(c => c.subject.toLowerCase());
      const matchesPurchased = purchasedSubjects.some(s =>
        course.subject.toLowerCase().includes(s) || s.includes(course.subject.toLowerCase())
      );
      if (matchesPurchased) {
        score += 30;
        if (!topReason) { topReason = 'Similar to your courses'; topReasonType = 'enrolled'; }
      }

      const previewedSubjects = previewedCourses
        .map(id => courses.find(c => c.id === id)?.subject.toLowerCase())
        .filter(Boolean) as string[];
      const matchesPreviewed = previewedSubjects.some(s =>
        course.subject.toLowerCase().includes(s) || s.includes(course.subject.toLowerCase())
      );
      if (matchesPreviewed) {
        score += 25;
        if (!topReason) { topReason = 'You previewed something similar'; topReasonType = 'previewed'; }
      }

      const searchTerms = searchHistory.map(s => s.toLowerCase());
      const courseSubject = course.subject.toLowerCase();
      const matchingTerm = searchTerms.find(term => {
        const words = term.split(/\s+/).filter(w => w.length > 2);
        return words.some(w => courseSubject.includes(w) || w.includes(courseSubject));
      });
      if (matchingTerm) {
        score += 40;
        topReason = `Based on "${matchingTerm.length > 20 ? matchingTerm.slice(0, 20) + '…' : matchingTerm}"`;
        topReasonType = 'search';
      }

      if (course.studentCount > 50) {
        score += 15;
        if (!topReason) { topReason = 'Popular with students'; topReasonType = 'popular'; }
      }

      if (course.rating >= 4.5) {
        score += 10;
        if (!topReason) { topReason = 'Highly rated'; topReasonType = 'trending'; }
      }

      if (course.grade === studentGrade) {
        score += 5;
        if (!topReason) { topReason = 'Matches your grade'; topReasonType = 'grade'; }
      }

      const completedInGrade = courses.filter(c => c.enrolled && c.grade === studentGrade && c.completionRate > 80).length;
      if (completedInGrade > 2) {
        const nextGrade = studentGrade === 'Common Entrance' ? '6' :
          studentGrade === '6' ? 'Common Entrance' : String(Number(studentGrade) + 1);
        if (course.grade === nextGrade) {
          score += 8;
          if (!topReason) { topReason = 'Ready for next level'; topReasonType = 'grade'; }
        }
      }

      if (score > 0) {
        if (!topReason) topReason = 'Recommended for you';
        recommendedSet.set(course.id, { course, score, reason: topReason, reasonType: topReasonType });
      }
    });

    return Array.from(recommendedSet.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
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
            c.term.toLowerCase().includes(query) ||
            (c.topics ?? []).some(t => t.toLowerCase().includes(query))
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

    // Category sidebar filter
    if (selectedCategory) {
      filtered = filtered.filter(course => course.subject === selectedCategory);
    }

    // Filter by purchased status
    if (showOnlyPurchased) {
      filtered = filtered.filter(course => course.enrolled);
    }

    // Free-only filter
    if (showFreeOnly) {
      filtered = filtered.filter(course => course.price === 0);
    }

    // Apply text search — subject, description, AND topic titles
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.subject.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        (course.topics ?? []).some(t => t.toLowerCase().includes(q))
      );
    }

    // Topic filter (separate from main search)
    if (selectedTopic) {
      const tq = selectedTopic.toLowerCase();
      filtered = filtered.filter(course =>
        (course.topics ?? []).some(t => t.toLowerCase().includes(tq))
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
  }, [courses, showOnlyPurchased, showFreeOnly, searchQuery, selectedTopic, selectedGrade, selectedSubject, selectedTerm, sortBy, selectedDifficulties, minRating, priceRange, selectedCategory]);

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
    // Note: enrollments are already seeded from localStorage in useState initializer,
    // so no need to re-apply cache here. Just fetch fresh data from the API.
    
    try {
      const [studentData, progress, enrollmentsData] = await Promise.all([
        getStudentByUserId(user.id),
        getUserProgress(user.id),
        getEnrollments()
      ]);
      
      console.log('[BrowseCourses] 📚 Fresh enrollments fetched:', {
        count: enrollmentsData.length,
        enrollments: enrollmentsData.map(e => ({
          subject: e.subject,
          grade: e.grade,
          term: e.term,
          isActive: e.isActive
        }))
      });
      
      // Cache enrollments to localStorage for faster subsequent loads
      localStorage.setItem('user_enrollments', JSON.stringify(enrollmentsData));
      // Keep enrollmentsRef in sync immediately so any in-flight fetchCoursesForGrade
      // calls pick up the real data before they call setCourses.
      enrollmentsRef.current = enrollmentsData;

      setStudentGrade(studentData.grade);
      setUserProgress(progress);
      setEnrollments(enrollmentsData);

      // Re-stamp any courses already in state with the fresh enrollments
      setCourses(prevCourses => {
        if (prevCourses.length === 0) return prevCourses;
        return prevCourses.map(course => ({
          ...course,
          enrolled: enrollmentsData.some(e => isEnrolledUtil(e, course.subject, course.grade, course.term)),
        }));
      });
      
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
  }, [user?.id]);

  // useEffects after function definitions
  useEffect(() => {
    // Use default items per page (settings endpoint requires admin access)
    setItemsPerPage(12);
    
    if (user?.id) {
      fetchStudentInfo();
    } else {
      // Clear cached enrollments when user logs out
      localStorage.removeItem('user_enrollments');
      setEnrollments([]);
    }
  }, [fetchStudentInfo, user?.id]);

  // Refetch enrollments when page becomes visible (e.g., after purchase)
  // Guard: only refetch if it has been more than 5 minutes since the last fetch
  const lastEnrollmentFetchRef = useRef<number>(0);
  const ENROLLMENT_REFETCH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const shouldRefetch = () => {
      const now = Date.now();
      if (now - lastEnrollmentFetchRef.current > ENROLLMENT_REFETCH_COOLDOWN_MS) {
        lastEnrollmentFetchRef.current = now;
        return true;
      }
      return false;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id && shouldRefetch()) {
        console.log('[BrowseCourses] Page became visible, refetching enrollments');
        fetchStudentInfo();
      }
    };
    
    const handleWindowFocus = () => {
      if (user?.id && shouldRefetch()) {
        console.log('[BrowseCourses] Window focused, refetching enrollments');
        fetchStudentInfo();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, fetchStudentInfo]);

  // Keep enrollmentsRef always current so fetchCoursesForGrade never reads stale data
  useEffect(() => {
    enrollmentsRef.current = enrollments;
  }, [enrollments]);

  // Cleanup alsoBought interval on unmount
  useEffect(() => {
    return () => {
      if (alsoBoughtTimerRef.current) clearInterval(alsoBoughtTimerRef.current);
    };
  }, []);

  // Update course enrolled status when enrollments change
  // Use JSON stringification to detect actual enrollment changes, not just length
  const enrollmentsKeyRef = useRef('');
  
  useEffect(() => {
    const enrollmentsKey = enrollments.map(e => `${e.grade}-${e.subject}-${e.term || 'none'}`).sort().join('|');
    if (enrollmentsKey === enrollmentsKeyRef.current) return;
    enrollmentsKeyRef.current = enrollmentsKey;

    // Use functional update to always work on the latest courses list (avoids stale closure)
    setCourses(prev => {
      if (prev.length === 0) return prev;
      const updated = prev.map(course => ({
        ...course,
        enrolled: enrollments.some(e => isEnrolledUtil(e, course.subject, course.grade, course.term)),
      }));
      const changed = updated.some((c, i) => c.enrolled !== prev[i].enrolled);
      return changed ? updated : prev;
    });
  }, [enrollments]); // courses no longer needed as dep since we use functional update

  useEffect(() => {
    // Load ALL grades on initial load only after enrollments have been fetched
    // Wait for enrollments to be loaded (even if empty array)
    if (enrollments !== null && loadedGrades.size === 0 && !isFetchingRef.current) {
      const loadAllGrades = async () => {
        // Load enrolled grades first so "My Purchased" tab is accurate immediately
        const enrolledGrades = [...new Set(enrollments.map(e => String(e.grade)))];
        const orderedGrades = [
          ...enrolledGrades.filter(g => grades.includes(g)),
          ...grades.filter(g => !enrolledGrades.includes(g)),
        ];
        console.log('[BrowseCourses] Loading grades in priority order:', orderedGrades);
        for (const grade of orderedGrades) {
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

  // Fetch review stats in background once courses are loaded (batch, 3 at a time)
  useEffect(() => {
    if (courses.length === 0) return;
    const uncached = courses.filter(c => reviewCache[c.id] === undefined);
    if (uncached.length === 0) return;

    const fetchBatch = async () => {
      // Take first 6 uncached to avoid too many parallel requests
      const batch = uncached.slice(0, 6);
      const results = await Promise.allSettled(
        batch.map(c => getReviewStats(c.subject, c.grade, c.term))
      );
      const updates: Record<string, { avg: number; total: number }> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          updates[batch[i].id] = { avg: r.value.averageRating, total: r.value.totalReviews };
        } else {
          updates[batch[i].id] = { avg: 0, total: 0 };
        }
      });
      setReviewCache(prev => ({ ...prev, ...updates }));
      // Also update the rating on the course objects
      setCourses(prev => prev.map(c => {
        if (updates[c.id]) {
          return { ...c, rating: updates[c.id].avg || c.rating, reviewCount: updates[c.id].total };
        }
        return c;
      }));
    };

    fetchBatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length]); // only re-run when course count changes

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
  // When a search query is active, show ALL results on one page (no pagination)
  useEffect(() => {
    if (searchQuery.trim()) {
      setDisplayedCourses(filteredCourses);
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setDisplayedCourses(filteredCourses.slice(startIndex, endIndex));
      // Scroll to top smoothly when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, filteredCourses, itemsPerPage, searchQuery]);

  // Ctrl+K / Cmd+K keyboard shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGrade !== 'all') params.set('grade', selectedGrade);
    if (selectedSubject !== 'all') params.set('subject', selectedSubject);
    if (selectedTerm !== 'all') params.set('term', selectedTerm);
    if (selectedTopic) params.set('topic', selectedTopic);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchQuery, selectedGrade, selectedSubject, selectedTerm, selectedTopic, selectedCategory, setSearchParams]);

  const fetchCoursesForGrade = async (grade: string) => {
    if (loadedGrades.has(grade) || isFetchingRef.current) return; // Already loaded or currently fetching
    
    try {
      isFetchingRef.current = true;
      setLoading(loadedGrades.size === 0); // Only show main loading on first load
      
      const gradeValue = grade === "Common Entrance" ? "Common Entrance" : grade;
      const newCourses: Course[] = [];
      const subjectsSet = new Set<string>();

      const terms = await getTermsByGrade(gradeValue);

      // Fetch enrollment counts if not yet loaded
      if (Object.keys(enrollmentCountsRef.current).length === 0) {
        try {
          const { api } = await import('@/lib/apiClient');
          const counts = await api.get('/subjects/enrollment-counts');
          if (counts && typeof counts === 'object') {
            enrollmentCountsRef.current = counts;
            setEnrollmentCounts(counts);
          }
        } catch (err) {
          console.error('[BrowseCourses] Could not fetch enrollment counts:', err);
        }
      }

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

      // Fetch lessons AND quiz counts for all subject-term combinations in parallel
      const lessonPromises = termSubjects.flatMap(({ term, subjects }) =>
        subjects.map(subject =>
          Promise.all([
            getLessonsBySubjectAndGrade(subject.name, gradeValue, term),
            getQuizzesByFilters(subject.name, gradeValue, term)
          ])
            .then(([lessons, quizzes]) => ({ subject, term, lessons, quizCount: quizzes.length, gradeValue }))
            .catch(err => {
              console.error(`Error fetching data for ${subject.name}:`, err);
              return { subject, term, lessons: [], quizCount: 0, gradeValue };
            })
        )
      );

      const allLessons = await Promise.all(lessonPromises);

      // Process all results
      allLessons.forEach(({ subject, term, lessons, quizCount, gradeValue }) => {
        if (lessons.length > 0) {
          subjectsSet.add(subject.name);
          
          // Use enrollmentsRef.current — always current, never stale closure
          const enrolled = enrollmentsRef.current.some(e =>
            isEnrolledUtil(e, subject.name, gradeValue, term)
          );
          
          if (enrolled) {
            console.log(`[BrowseCourses] ✅ Found PURCHASED course: ${subject.name} (${gradeValue}-${term})`);
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
          
          // Format duration: show hours if ≥ 60 min, otherwise show minutes
          const durationDisplay = totalDuration >= 60
            ? `${Math.ceil(totalDuration / 60)}h`
            : `${totalDuration}m`;
          
          // Use the first lesson's description if available, else empty
          const description = lessons[0]?.description?.trim() || '';
          
          newCourses.push({
            id: `${grade}-${term}-${subject.name}`,
            subject: subject.name,
            grade: grade,
            term: term,
            lessonCount: lessons.length,
            quizCount,
            description,
            difficulty: validDifficulty,
            estimatedHours: Math.ceil(totalDuration / 60), // Convert minutes to hours
            durationDisplay,
            completionRate,
            enrolled,
            price: subject.price || 0,
            rating: subject.rating || 0,
            studentCount: enrollmentCountsRef.current[`${subject.name}|${gradeValue}|${term}`] || 0,
            imageUrl: lessons[0]?.imageUrl || undefined,
            topics: lessons.map(l => l.title),
            lessonIds: lessons.map(l => l.id),
            reviewCount: 0,
          });
        }
      });

      // Merge with existing subjects instead of replacing
      setAvailableSubjects(prev => {
        const merged = new Set([...prev, ...Array.from(subjectsSet)]);
        return Array.from(merged).sort();
      });
      
      // Merge courses while preserving / correcting enrolled status
      setCourses(prev => {
        const existingCourseMap = new Map(prev.map(c => [c.id, c]));
        const updatedCourses = [...prev];
        
        newCourses.forEach(newCourse => {
          // Always re-check via the ref — this is the ONLY source of truth for enrolled status
          // regardless of what value was computed in the stale closure above.
          const isEnrolledNow = enrollmentsRef.current.some(e =>
            isEnrolledUtil(e, newCourse.subject, newCourse.grade, newCourse.term)
          );
          const courseWithCorrectStatus = { ...newCourse, enrolled: isEnrolledNow };

          const existing = existingCourseMap.get(newCourse.id);
          if (existing) {
            const index = updatedCourses.findIndex(c => c.id === newCourse.id);
            updatedCourses[index] = courseWithCorrectStatus;
          } else {
            updatedCourses.push(courseWithCorrectStatus);
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
      term: course.term,
      price: course.price
    });
    toast({
      title: "Added to cart",
      description: `${course.subject} has been added to your cart.`
    });

    // Show "Students also bought" panel
    setJustAddedCourse(course);
    setAlsoBoughtCountdown(15);
    setShowAlsoBought(true);
    // Clear any existing timer
    if (alsoBoughtTimerRef.current) clearInterval(alsoBoughtTimerRef.current);
    let remaining = 15;
    alsoBoughtTimerRef.current = setInterval(() => {
      remaining -= 1;
      setAlsoBoughtCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(alsoBoughtTimerRef.current!);
        setShowAlsoBought(false);
      }
    }, 1000);
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
    setSelectedTopic('');
    setShowFreeOnly(false);
    setSelectedCategory('');
    setSortBy('popular');
    setSelectedDifficulties([]);
    setMinRating(0);
    setPriceRange([0, 10000]);
  };

  // Returns the enrolled course that was most recently accessed
  const getLastAccessedCourse = (): Course | null => {
    if (!userProgress.length || !courses.length) return null;
    const sorted = [...userProgress]
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    if (!sorted.length) return null;
    return courses.find(c => (c.lessonIds ?? []).includes(sorted[0].lessonId) && c.enrolled) ?? null;
  };

  // Get the last-accessed lesson title for the Continue banner
  const getLastAccessedLessonTitle = (): string | null => {
    if (!userProgress.length) return null;
    const sorted = [...userProgress]
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    if (!sorted.length) return null;
    // Match lesson id to a topic title from the course
    const lastLessonId = sorted[0].lessonId;
    for (const c of courses) {
      const idx = (c.lessonIds ?? []).indexOf(lastLessonId);
      if (idx !== -1 && (c.topics ?? [])[idx]) return (c.topics ?? [])[idx];
    }
    return null;
  };

  // "Students also bought" — unenrolled courses from same grade or subject
  // Scored: same grade + same subject (4pts), same grade only (2pts), same subject only (1pt)
  const getAlsoBoughtCourses = (source: Course): Course[] => {
    return courses
      .filter(c =>
        !c.enrolled &&
        !isInCart(c.subject, c.grade, c.term) &&
        c.id !== source.id &&
        (c.grade === source.grade || c.subject === source.subject)
      )
      .map(c => {
        const sameGrade = c.grade === source.grade;
        const sameSub = c.subject === source.subject;
        const score = (sameGrade && sameSub ? 4 : sameGrade ? 2 : 1) + c.studentCount * 0.01 + c.rating * 0.5;
        return { course: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(x => x.course)
      .slice(0, 6);
  };

  // Build a map of subject name → courses for the sidebar (dynamic, from DB)
  const getCategoryMap = (): Record<string, Course[]> => {
    const map: Record<string, Course[]> = {};
    courses.forEach(c => {
      if (!map[c.subject]) map[c.subject] = [];
      map[c.subject].push(c);
    });
    return map;
  };

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    switch (diff) {
      case 'beginner': 
      case 'easy': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'intermediate': 
      case 'medium': 
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'advanced': 
      case 'hard': 
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: 
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />

      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
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
            {loading ? 'Loading amazing lessonss...' : `Choose from ${new Set(courses.map(c => c.subject)).size} Subject${new Set(courses.map(c => c.subject)).size > 1 ? 's' : ''} with ${courses.length}+ expertly crafted lessons across all grades`}
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
                <p className="text-sm text-muted-foreground">Lessons Available</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-green-600">{new Set(enrollments.map(e => `${e.subject}-${e.grade}`)).size}</p>
                <p className="text-sm text-muted-foreground">Enrolled Lessons</p>
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

        {/* Continue Where You Left Off */}
        {(() => {
          const lastCourse = getLastAccessedCourse();
          if (!lastCourse || loading) return null;
          const lastLesson = getLastAccessedLessonTitle();
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-md overflow-hidden">
                {/* Subtle animated progress stripe */}
                {lastCourse.completionRate > 0 && (
                  <div className="h-1 bg-indigo-100 dark:bg-indigo-900/30">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                      style={{ width: `${lastCourse.completionRate}%` }}
                    />
                  </div>
                )}
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <PlayCircle className="w-7 h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-0.5">
                        ▶ Continue where you left off
                      </p>
                      <p className="font-bold text-foreground truncate text-lg leading-tight">{lastCourse.subject}</p>
                      {lastLesson && (
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 truncate max-w-xs">
                          Next: {lastLesson}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lastCourse.grade === "Common Entrance" ? "Common Entrance" : `Grade ${lastCourse.grade}`} &bull; {lastCourse.term}
                        {lastCourse.completionRate > 0 && (
                          <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                            {lastCourse.completionRate}% complete
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/subjects/${lastCourse.grade}/${lastCourse.subject}${lastCourse.term ? `?term=${encodeURIComponent(lastCourse.term)}` : ''}`)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-shrink-0 shadow-lg"
                    size="lg"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

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
                    My Purchased ({enrollments.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Search Bar - Professional Design */}
            <div className="relative mb-6" ref={searchRef}>
              {/* Glowing background effect when focused */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300 pointer-events-none" />
              <div className="relative flex items-center gap-2 h-14 bg-white dark:bg-gray-900 border-2 border-purple-100 dark:border-purple-900/50 rounded-xl shadow-md hover:border-purple-300 dark:hover:border-purple-700 focus-within:border-purple-500 dark:focus-within:border-purple-500 focus-within:shadow-purple-200/50 dark:focus-within:shadow-purple-900/50 focus-within:shadow-lg transition-all duration-200 px-4 group">
                {/* Search Icon */}
                <Search className="w-5 h-5 text-purple-400 flex-shrink-0 group-focus-within:text-purple-600 transition-colors" />
                {/* Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search subjects, grades, terms…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && searchSuggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); setShowSuggestions(false); } }}
                  className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/60 text-foreground"
                />
                {/* Right side — clear or shortcut hint */}
                {searchQuery ? (
                  <button
                    onClick={() => { setSearchQuery(''); setShowSuggestions(false); searchInputRef.current?.focus(); }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Clear search (Esc)"
                  >
                    <span className="text-xs font-medium hidden sm:block">Clear</span>
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 border border-muted-foreground/20 rounded bg-muted/40 flex-shrink-0 select-none">
                    <span className="text-[9px]">Ctrl</span>
                    <span>K</span>
                  </kbd>
                )}
              </div>
              
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

            {/* Topic Search & Free-Only Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-pink-600" />
                  Search by Topic
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="e.g. Fractions, Photosynthesis, Algebra…"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="pl-9 h-11 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                  {selectedTopic && (
                    <button
                      onClick={() => setSelectedTopic('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowFreeOnly(!showFreeOnly)}
                  className={`h-11 flex items-center gap-2 px-4 rounded-lg border-2 text-sm font-semibold transition-all whitespace-nowrap ${
                    showFreeOnly
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-700 text-foreground hover:border-green-400 dark:hover:border-green-600'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Free Only
                  {showFreeOnly && <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); setShowFreeOnly(false); }} />}
                </button>
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
              {(searchQuery || selectedGrade !== 'all' || selectedSubject !== 'all' || selectedTerm !== 'all' || selectedDifficulties.length > 0 || selectedTopic || showFreeOnly) && (
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
                  {selectedTopic && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0">
                      <Tag className="w-3 h-3" />
                      Topic: {selectedTopic}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedTopic('')} />
                    </Badge>
                  )}
                  {showFreeOnly && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                      <Zap className="w-3 h-3" />
                      Free Only
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setShowFreeOnly(false)} />
                    </Badge>
                  )}
                  {selectedCategory && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0">
                      <Tag className="w-3 h-3" />
                      {selectedCategory}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCategory('')} />
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

        {/* Results Count / Search Results Banner */}
        {searchQuery.trim() && !loading ? (
          /* ── Search Results Full-Page Banner ── */
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-gray-900 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex-shrink-0">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                    {filteredCourses.length === 0
                      ? 'No results'
                      : filteredCourses.length === 1
                        ? '1 result'
                        : `${filteredCourses.length} results`}
                    <span className="font-normal text-muted-foreground">for</span>
                    <span className="italic text-purple-600 dark:text-purple-400 truncate max-w-[200px] sm:max-w-none">&ldquo;{searchQuery}&rdquo;</span>
                    {isLoadingBackground && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All matching courses are shown below &mdash; no pagination while searching
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {filteredCourses.length > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1.5 border-purple-300 text-purple-700">
                      <BookOpen className="w-3 h-3" />
                      {filteredCourses.filter(c => !c.enrolled).length} available
                    </Badge>
                    {filteredCourses.filter(c => c.enrolled).length > 0 && (
                      <Badge variant="outline" className="gap-1.5 border-green-300 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        {filteredCourses.filter(c => c.enrolled).length} owned
                      </Badge>
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Normal Results Header ── */
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
                     `${filteredCourses.length} Lessons Available`}
                    {isLoadingBackground && (
                      <span title="Loading more courses in background">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {enrollments.length} enrolled • {filteredCourses.filter(c => !c.enrolled).length} available
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
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-purple-300 text-purple-700">
                  <Trophy className="w-3 h-3" />
                  {enrollments.length} Enrolled
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-blue-300 text-blue-700">
                  <Zap className="w-3 h-3" />
                  {availableSubjects.length} Subjects
                </Badge>
                <Button
                  variant={showSidebar ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowSidebar(v => !v)}
                  className={showSidebar
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0'
                    : 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  }
                >
                  {showSidebar ? <PanelLeftClose className="w-4 h-4 mr-1.5" /> : <PanelLeftOpen className="w-4 h-4 mr-1.5" />}
                  Browse by Subjects
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Category Browse Sidebar Panel */}
        <AnimatePresence>
          {showSidebar && !loading && courses.length > 0 && (() => {
            const catMap = getCategoryMap();
            const subjects = Object.keys(catMap).sort();
            return (
              <motion.div
                key="cat-sidebar"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="border-2 border-rose-200 dark:border-rose-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">Browse by Category</h3>
                      </div>
                      {selectedCategory && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('')} className="text-rose-600 hover:text-rose-700">
                          <X className="w-3 h-3 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {subjects.map((subject, idx) => {
                        const catCourses = catMap[subject] ?? [];
                        if (catCourses.length === 0) return null;
                        const isActive = selectedCategory === subject;
                        const gradient = CATEGORY_COLOR_PALETTE[idx % CATEGORY_COLOR_PALETTE.length];
                        return (
                          <button
                            key={subject}
                            onClick={() => setSelectedCategory(isActive ? '' : subject)}
                            className={`relative rounded-xl p-3 text-left transition-all duration-200 border-2 overflow-hidden group ${
                              isActive
                                ? 'border-transparent shadow-lg scale-105'
                                : 'border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-md hover:scale-105'
                            }`}
                          >
                            {/* Gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity ${
                              isActive ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                            }`} />
                            <div className="relative">
                              <p className={`font-bold text-sm leading-tight mb-1 ${
                                isActive ? `text-transparent bg-clip-text bg-gradient-to-br ${gradient}` : 'text-foreground'
                              }`}>{subject}</p>
                              <p className="text-xs text-muted-foreground">{catCourses.length} course{catCourses.length !== 1 ? 's' : ''}</p>
                              {isActive && <div className={`mt-1.5 h-1 rounded-full bg-gradient-to-r ${gradient}`} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Students Also Bought — Udemy-style fixed bottom panel (rendered via portal at bottom of page) */}

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
                <h3 className="text-2xl font-bold mb-3">No Lessons Available</h3>
                <p className="text-muted-foreground mb-4 text-lg">
                  There are currently no lessons available in the database. Please check back later or contact support.
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
            <Card className="p-10 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-800">
              <div className="text-center max-w-md mx-auto mb-8">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : showOnlyPurchased
                      ? "You haven't purchased any courses yet"
                      : "No Courses Found"}
                </h3>
                <p className="text-muted-foreground mb-6 text-base">
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

              {/* Personalized suggestions for student's grade */}
              {(() => {
                const grade = studentGrade || selectedGrade;
                if (!grade || grade === 'all') return null;
                const suggestions = courses
                  .filter(c => c.grade === grade && !c.enrolled)
                  .sort((a, b) => b.studentCount - a.studentCount)
                  .slice(0, 4);
                if (suggestions.length === 0) return null;
                return (
                  <div className="border-t border-purple-200 dark:border-purple-800 pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="font-bold text-base">
                        Suggested for {grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${grade}`} students
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {suggestions.map(course => (
                        <div
                          key={course.id}
                          className="group cursor-pointer"
                          onClick={() => { clearFilters(); handleViewCourse(course); }}
                        >
                          <Card className="border hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all overflow-hidden">
                            <div className={`h-14 flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 relative`}>
                              {(course.imageUrl || course.thumbnail) ? (
                                <img src={course.imageUrl || course.thumbnail} alt={course.subject} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <BookOpen className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <CardContent className="p-2.5">
                              <p className="font-semibold text-xs truncate group-hover:text-purple-600 transition-colors">{course.subject}</p>
                              <p className="text-xs text-muted-foreground">{course.term}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm font-bold text-purple-600">{formatCurrency(course.price)}</p>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(course.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Click any course above to view it, or{' '}
                      <button className="text-purple-600 underline font-medium hover:text-purple-700" onClick={clearFilters}>
                        clear all filters
                      </button>{' '}
                      to browse everything.
                    </p>
                  </div>
                );
              })()}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 mb-10"
          >
            {displayedCourses.map((course) => (
              <motion.div
                key={course.id}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* ── MOBILE: Udemy-style compact horizontal row ── */}
                <div
                  className={`sm:hidden rounded-xl overflow-hidden cursor-pointer border shadow-sm active:scale-[0.98] transition-transform ${
                    course.enrolled
                      ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                  }`}
                  onClick={() => handleViewCourse(course)}
                >
                  {/* Thumbnail */}
                  <div className={`relative w-full aspect-video overflow-hidden ${
                    course.enrolled
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500'
                  }`}>
                    {(course.imageUrl || course.thumbnail) && (
                      <img
                        src={course.imageUrl || course.thumbnail}
                        alt={course.subject}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {/* Badges overlay */}
                    <div className="absolute top-1.5 left-1.5 flex gap-1">
                      {isNewCourse(course.lessonCount) && !course.enrolled && (
                        <span className="bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">New</span>
                      )}
                      {isPopular(course) && (
                        <span className="bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Hot</span>
                      )}
                    </div>
                    {course.enrolled && (
                      <div className="absolute top-1.5 right-1.5">
                        <CheckCircle className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                    {/* Wishlist */}
                    {!course.enrolled && (
                      <button
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center shadow"
                        onClick={(e) => { e.stopPropagation(); handleToggleWishlist(course); }}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isInWishlist(course.subject, course.grade, course.term) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <h4 className="font-bold text-[13px] leading-tight line-clamp-2 text-foreground mb-1">
                      {course.subject}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      {course.grade === 'Common Entrance' ? 'CE' : `Gr.${course.grade}`} · {course.term.replace(' Term', '')}
                    </p>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[11px] font-bold text-amber-600">{course.rating > 0 ? course.rating.toFixed(1) : '—'}</span>
                      <div className="flex gap-px">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(course.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'}`} />
                        ))}
                      </div>
                    </div>
                    {/* Progress bar for enrolled */}
                    {course.enrolled && course.completionRate > 0 && (
                      <div className="mb-2">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${course.completionRate}%` }} />
                        </div>
                        <p className="text-[10px] text-purple-600 font-medium mt-0.5">{course.completionRate}%</p>
                      </div>
                    )}
                    {/* Price row */}
                    <div className="flex items-center justify-between">
                      {course.enrolled ? (
                        <span className="text-[11px] font-semibold text-green-600 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Purchased
                        </span>
                      ) : (
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(course.price)}</span>
                      )}
                      {course.enrolled ? (
                        <button
                          className="text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-1 rounded-lg"
                          onClick={(e) => { e.stopPropagation(); handleViewCourse(course); }}
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            isInCart(course.subject, course.grade, course.term)
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(course); }}
                        >
                          {isInCart(course.subject, course.grade, course.term) ? '✓ Cart' : '+ Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── DESKTOP (sm+): Full rich card ── */}
                <Card className={`hidden sm:flex flex-col h-full group overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  course.enrolled 
                    ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 ring-2 ring-green-200 dark:ring-green-900/50' 
                    : 'border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20'
                }`}>
                  {/* Course Header with Thumbnail */}
                  <div className={`relative h-40 sm:h-48 overflow-hidden ${
                    course.enrolled 
                      ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500' 
                      : 'bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500'
                  }`}>
                    {/* Thumbnail Image */}
                    {(course.imageUrl || course.thumbnail) ? (
                      <>
                        <img 
                          src={course.imageUrl || course.thumbnail} 
                          alt={course.subject}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                    )}
                    
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
                    
                    {!(course.imageUrl || course.thumbnail) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="w-10 h-10 text-white" />
                        </div>
                      </div>
                    )}
                    
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
                            {course.durationDisplay || (course.estimatedHours > 0 ? `${course.estimatedHours}h` : '30m')}
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
                        <Button 
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group font-bold"
                          onClick={() => handleViewCourse(course)}
                        >
                          <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Start Learning
                        </Button>
                      ) : (
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
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls — hidden while search is active */}
        {!loading && !searchQuery.trim() && filteredCourses.length > itemsPerPage && (
          <div className="flex flex-col items-center gap-4 pt-6 pb-12 border-t border-purple-100 dark:border-purple-900/30">
            <p className="text-sm font-medium text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
            </p>
            <div className="flex justify-center items-center gap-2">
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
          </div>
        )}

        {/* Results Summary — shown only during search */}
        {!loading && filteredCourses.length > 0 && searchQuery.trim() && (
          <div className="text-center pb-8">
            <p className="text-sm text-muted-foreground">
              {`Showing all ${filteredCourses.length} result${filteredCourses.length === 1 ? '' : 's'} for "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Recently Viewed */}
        {!loading && !searchQuery.trim() && recentlyViewed.length > 0 && (() => {
          const recentCourses = recentlyViewed
            .map(id => courses.find(c => c.id === id))
            .filter(Boolean) as Course[];
          if (recentCourses.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">Recently Viewed</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
                {recentCourses.slice(0, 8).map((course) => (
                  <div
                    key={course.id}
                    className="flex-shrink-0 w-48 cursor-pointer group"
                    onClick={() => { addToRecentlyViewed(course.id); handleViewCourse(course); }}
                  >
                    <Card className="border hover:shadow-md transition-all group-hover:border-purple-300 dark:group-hover:border-purple-700 overflow-hidden">
                      <div className={`h-20 flex items-center justify-center ${
                        course.enrolled
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                          : 'bg-gradient-to-br from-purple-400 to-pink-500'
                      }`}>
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <CardContent className="p-3">
                        <p className="font-semibold text-sm truncate group-hover:text-purple-600 transition-colors">{course.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {course.grade === "Common Entrance" ? "CE" : `Gr. ${course.grade}`} &bull; {course.term}
                        </p>
                        {course.enrolled
                          ? <p className="text-xs text-green-600 font-medium mt-0.5">✓ Purchased</p>
                          : <p className="text-xs text-purple-600 font-bold mt-0.5">{formatCurrency(course.price)}</p>
                        }
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

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

        {/* Recommended for You Section - AI-Powered */}
        {(() => {
          const recommendations = getRecommendedCourses();
          if (loading || recommendations.length === 0) return null;

          // Colour palette per recommendation reason type
          const reasonStyles: Record<string, {
            gradient: string;
            headerBg: string;
            reasonBadge: string;
            accentText: string;
            icon: React.FC<{ className?: string }>;
            label: string;
          }> = {
            'search':   { gradient: 'from-violet-600 via-purple-500 to-fuchsia-500', headerBg: 'from-violet-400 via-purple-400 to-fuchsia-400', reasonBadge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', accentText: 'group-hover:text-violet-600', icon: Search,     label: 'Search Match'   },
            'enrolled': { gradient: 'from-emerald-600 via-teal-500 to-green-500',   headerBg: 'from-emerald-400 via-teal-400 to-green-400',   reasonBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', accentText: 'group-hover:text-emerald-600', icon: GraduationCap, label: 'Similar Course'  },
            'previewed':{ gradient: 'from-blue-600 via-sky-500 to-cyan-500',        headerBg: 'from-blue-400 via-sky-400 to-cyan-400',        reasonBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',           accentText: 'group-hover:text-blue-600',    icon: Eye,           label: 'You Previewed'  },
            'popular':  { gradient: 'from-orange-600 via-amber-500 to-yellow-500',  headerBg: 'from-orange-400 via-amber-400 to-yellow-400',  reasonBadge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',   accentText: 'group-hover:text-orange-600',  icon: TrendingUp,    label: 'Trending'       },
            'grade':    { gradient: 'from-rose-600 via-pink-500 to-fuchsia-500',    headerBg: 'from-rose-400 via-pink-400 to-fuchsia-400',    reasonBadge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',           accentText: 'group-hover:text-rose-600',    icon: Target,        label: 'Grade Match'    },
            'trending': { gradient: 'from-indigo-600 via-purple-500 to-blue-500',   headerBg: 'from-indigo-400 via-purple-400 to-blue-400',   reasonBadge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',  accentText: 'group-hover:text-indigo-600',  icon: Star,          label: 'Top Rated'      },
          };

          // Match strength: 0–40 pts → 1 dot, 41–70 → 2 dots, 71+ → 3 dots
          const matchDots = (score: number) => Math.min(3, Math.ceil(score / 30));

          return (
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
                            <Zap className="w-4 h-4 text-amber-500" />
                            Personalised based on your searches, activity, and learning progress
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Reason type legend chips */}
                        {[...new Set(recommendations.map(r => r.reasonType))].map(type => {
                          const s = reasonStyles[type];
                          if (!s) return null;
                          const Icon = s.icon;
                          return (
                            <span key={type} className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.reasonBadge}`}>
                              <Icon className="w-3 h-3" />
                              {s.label}
                            </span>
                          );
                        })}
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-2 text-sm">
                          {recommendations.length} Picks
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Course Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((rec, index) => {
                  const course: Course = rec.course;
                  const { reason, reasonType, score } = rec;
                  const style = reasonStyles[reasonType] ?? reasonStyles['popular'];
                  const Icon = style.icon;
                  const dots = matchDots(score);
                  const wishlisted = isInWishlist(course.subject, course.grade, course.term);
                  const inCart = isInCart(course.subject, course.grade, course.term);
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.4 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                    >
                      <Card className={`h-full hover:shadow-2xl transition-all duration-300 border-2 border-transparent group overflow-hidden bg-white dark:bg-gray-900 hover:border-current`}
                        style={{ '--tw-border-opacity': '0.25' } as React.CSSProperties}
                      >
                        {/* Coloured Header */}
                        <div className={`relative h-32 bg-gradient-to-br ${style.headerBg} overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                          <div className="absolute top-1 right-1 w-20 h-20 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>

                          {/* Central Icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                          </div>

                          {/* Reason badge — top left */}
                          <div className="absolute top-2.5 left-2.5">
                            <Badge className={`${style.reasonBadge} border-0 shadow text-xs font-semibold flex items-center gap-1 px-2 py-0.5`}>
                              <Icon className="w-3 h-3" />
                              {reason}
                            </Badge>
                          </div>

                          {/* Wishlist toggle — top right */}
                          <button
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
                            onClick={e => { e.stopPropagation(); handleToggleWishlist(course); }}
                            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 hover:text-rose-500'}`} />
                          </button>

                          {/* Match-strength dots — bottom right */}
                          <div className="absolute bottom-2 right-2 flex gap-0.5">
                            {[1, 2, 3].map(d => (
                              <span key={d} className={`block w-1.5 h-1.5 rounded-full ${d <= dots ? 'bg-white' : 'bg-white/30'}`} />
                            ))}
                            <span className="text-white/70 text-[9px] ml-1 leading-[6px] self-end">match</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <CardContent className="p-4 flex flex-col gap-3">
                          <div>
                            <h3 className={`font-bold text-base mb-0.5 line-clamp-1 transition-colors ${style.accentText}`}>
                              {course.subject}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>{course.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${course.grade}`}</span>
                              <span>·</span>
                              <span>{course.term}</span>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1.5 rounded-lg">
                              <BookOpen className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{course.lessonCount} lessons</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1.5 rounded-lg">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{course.studentCount}+ students</span>
                            </div>
                          </div>

                          {/* Rating + Price */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.floor(course.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                              ))}
                              <span className="text-xs font-semibold ml-1 text-muted-foreground">{course.rating.toFixed(1)}</span>
                            </div>
                            <span className={`text-base font-bold bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}>
                              {formatCurrency(course.price)}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handlePreviewCourse(course)}>
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              className={`flex-1 text-xs text-white bg-gradient-to-r ${style.gradient} hover:opacity-90 shadow-sm`}
                              onClick={() => handleAddToCart(course)}
                              disabled={inCart}
                            >
                              {inCart ? <><CheckCircle className="w-3 h-3 mr-1" />In Cart</> : <><ShoppingCart className="w-3 h-3 mr-1" />Add</>}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
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

      {/* ═══════════════════════════════════════════════════════
          Students Also Bought — Professional fixed bottom panel
          ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAlsoBought && justAddedCourse && (() => {
          const alsoBought = getAlsoBoughtCourses(justAddedCourse);
          const dismiss = () => {
            setShowAlsoBought(false);
            if (alsoBoughtTimerRef.current) clearInterval(alsoBoughtTimerRef.current);
          };
          const COLORS = [
            'from-violet-500 to-purple-600',
            'from-blue-500 to-indigo-600',
            'from-emerald-500 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-rose-500 to-pink-600',
            'from-cyan-500 to-sky-600',
          ];
          return (
            <>
              {/* Subtle backdrop */}
              <motion.div
                key="also-bought-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[58] bg-black/20 backdrop-blur-[1px]"
                onClick={dismiss}
              />

              <motion.div
                key="also-bought-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 38 }}
                className="fixed bottom-0 left-0 right-0 z-[60]"
                style={{ maxHeight: '82vh' }}
              >
                {/* ── Countdown bar ── */}
                <div className="h-[3px] bg-gray-200 dark:bg-gray-800 w-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(alsoBoughtCountdown / 15) * 100}%` }}
                    transition={{ duration: 0.95, ease: 'linear' }}
                  />
                </div>

                {/* ── Dark notification header (Udemy-style) ── */}
                <div className="bg-gray-900 dark:bg-black px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
                  {/* Left: added-to-cart confirmation */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-0.5">Added to cart</p>
                      <p className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
                        {justAddedCourse.subject}
                        <span className="text-gray-400 font-normal ml-2 text-xs">
                          {justAddedCourse.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${justAddedCourse.grade}`} · {justAddedCourse.term}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: CTAs */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex border-gray-600 text-gray-200 bg-transparent hover:bg-gray-800 hover:text-white font-semibold h-9"
                      onClick={dismiss}
                    >
                      Continue Shopping
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-9 px-5 shadow-lg shadow-purple-500/30 flex items-center gap-1.5"
                      onClick={() => { dismiss(); navigate('/cart'); }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Go to Cart
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <button
                      onClick={dismiss}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── White body ── */}
                <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                  {alsoBought.length > 0 ? (
                    <>
                      {/* Section label */}
                      <div className="px-4 sm:px-8 pt-4 pb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-bold text-foreground tracking-tight">Students also bought</h3>
                        <span className="text-xs text-muted-foreground">— frequently purchased together</span>
                      </div>

                      {/* Cards row — horizontal scroll on mobile, wrapping on desktop */}
                      <div className="overflow-x-auto pb-5 px-4 sm:px-8">
                        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                          {alsoBought.map((course, idx) => {
                            const inCart = isInCart(course.subject, course.grade, course.term);
                            const isBestseller = course.studentCount >= 5 || course.rating >= 4;
                            return (
                              <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                className="group flex-shrink-0 w-[210px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                                onClick={() => { dismiss(); handleViewCourse(course); }}
                              >
                                {/* 16:9 Thumbnail */}
                                <div className="relative w-full aspect-video overflow-hidden">
                                  {(course.imageUrl || course.thumbnail) ? (
                                    <img
                                      src={course.imageUrl || course.thumbnail}
                                      alt={course.subject}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${COLORS[idx % COLORS.length]} flex items-center justify-center`}>
                                      <BookOpen className="w-8 h-8 text-white/80" />
                                    </div>
                                  )}
                                  {/* Bestseller badge */}
                                  {isBestseller && (
                                    <div className="absolute top-2 left-2">
                                      <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shadow">
                                        <BadgeCheck className="w-2.5 h-2.5" />
                                        Bestseller
                                      </span>
                                    </div>
                                  )}
                                  {/* Term badge */}
                                  <div className="absolute bottom-2 right-2">
                                    <span className="bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
                                      {course.term.replace(' Term', '')}
                                    </span>
                                  </div>
                                </div>

                                {/* Card body */}
                                <div className="p-3">
                                  <h4 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mb-1">
                                    {course.subject}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground mb-2">
                                    {course.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${course.grade}`}
                                  </p>

                                  {/* Rating */}
                                  <div className="flex items-center gap-1 mb-2">
                                    <span className="text-[12px] font-bold text-amber-600 leading-none">
                                      {course.rating > 0 ? course.rating.toFixed(1) : 'New'}
                                    </span>
                                    <div className="flex gap-px">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${
                                          i < Math.floor(course.rating)
                                            ? 'fill-amber-400 text-amber-400'
                                            : i < course.rating
                                            ? 'fill-amber-200 text-amber-200'
                                            : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                                        }`} />
                                      ))}
                                    </div>
                                    {course.studentCount > 0 && (
                                      <span className="text-[11px] text-muted-foreground">({course.studentCount.toLocaleString()})</span>
                                    )}
                                  </div>

                                  {/* Meta: duration + lessons */}
                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {course.durationDisplay || (course.estimatedHours > 0 ? `${course.estimatedHours}h` : '—')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" />
                                      {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
                                    </span>
                                  </div>

                                  {/* Price row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-base font-extrabold text-gray-900 dark:text-white">
                                      {formatCurrency(course.price)}
                                    </span>
                                    <Button
                                      size="sm"
                                      className={`h-8 px-3 text-xs font-semibold flex-shrink-0 ${
                                        inCart
                                          ? 'bg-green-600 hover:bg-green-700 text-white'
                                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                                      }`}
                                      onClick={(e) => { e.stopPropagation(); handleAddToCart(course); }}
                                      disabled={inCart}
                                    >
                                      {inCart ? (
                                        <><CheckCircle className="w-3.5 h-3.5 mr-1" />In Cart</>
                                      ) : (
                                        <><ShoppingCart className="w-3.5 h-3.5 mr-1" />Add</>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* No recommendations — just show checkout prompt */
                    <div className="px-4 sm:px-8 py-6 flex items-center gap-4">
                      <ShoppingBag className="w-10 h-10 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Great choice!</p>
                        <p className="text-sm text-muted-foreground">Ready to start learning? Head to your cart to complete your purchase.</p>
                      </div>
                      <Button
                        className="ml-auto bg-purple-600 hover:bg-purple-700 text-white font-bold flex-shrink-0"
                        onClick={() => { dismiss(); navigate('/cart'); }}
                      >
                        Checkout <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          );
        })()}
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
              term: selectedCourseForPreview.term,
              price: selectedCourseForPreview.price
            });
            toast({
              title: "Added to cart",
              description: `${selectedCourseForPreview.title} has been added to your cart.`
            });
          }
        }}
        isEnrolled={selectedCourseForPreview ? enrollments.some(e =>
          isEnrolledUtil(e, selectedCourseForPreview.subject, selectedCourseForPreview.grade, selectedCourseForPreview.term)
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
