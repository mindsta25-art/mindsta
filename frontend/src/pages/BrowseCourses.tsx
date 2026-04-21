import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Package,
  BarChart3,
  Target,
  PlayCircle,
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
import { getLessons, getLessonPreviewById, type Lesson, getLessonsBySubjectAndGrade } from "@/api/lessons";
import { getQuizzesByFilters } from "@/api/quizzes";
import { getUserProgress, type UserProgress } from "@/api/progress";
import { getStudentByUserId } from "@/api";
import { getEnrollments, type Enrollment } from "@/api/enrollments";
import { getSystemSettings } from "@/api/settings";
import { formatCurrency } from "@/config/siteConfig";
import { recordSearch, getSearchKeywords } from "@/api/search-history";
import { getRatingStats } from "@/api/reviews";

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
  lessonTitle?: string; // individual lesson title (when card represents one lesson)
  lessonId?: string;    // specific lesson id for direct navigation
  createdAt?: string;   // ISO date string for "New" badge logic
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

const Browselessons = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [lessons, setlessons] = useState<Course[]>([]);
  const [filteredlessons, setFilteredlessons] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [currentRecommendationPage, setCurrentRecommendationPage] = useState(1);
  const recommendationItemsPerPage = 12;
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
    // (prevents the stale-closure downgrade from fetchlessonsForGrade)
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
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Course[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Smart recommendation state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [previewedlessons, setPreviewedlessons] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  // Topic + free-only filter state
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || '');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Sidebar category filter
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Mobile filter panel toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  
  // Enrollment counts per subject-grade-term (for student count display)
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const enrollmentCountsRef = useRef<Record<string, number>>({});

  const maxPriceLimit = useMemo(() => {
    const maxPriceFromLessons = lessons.reduce((max, course) => {
      const normalizedPrice = Number.isFinite(course.price) ? course.price : 0;
      return Math.max(max, normalizedPrice);
    }, 0);
    return Math.max(10000, maxPriceFromLessons);
  }, [lessons]);

  const isInitialLoad = useRef(true);
  const isFetchingRef = useRef(false);
  // Ref-based loadedGrades so async callbacks always read the current set (avoids stale closures)
  const loadedGradesRef = useRef<Set<string>>(new Set());
  // Always-current enrollment ref — used inside fetchlessonsForGrade to avoid stale closures
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
        staggerChildren: 0.04
      }
    }
  };

  // Helper functions
  const isNewCourse = (createdAt?: string) => {
    if (!createdAt) return false;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(createdAt).getTime() > sevenDaysAgo;
  };

  const isPopular = (course: Course) => {
    const totalContent = course.lessonCount + course.quizCount;
    return totalContent > 10 || course.studentCount > 50;
  };

  const getTrendinglessons = () => {
    return lessons
      .filter(c => c.studentCount > 20)
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 6);
  };

  // Returns enriched recommendation objects with reason labels
  const getRecommendedlessons = (): Array<{ course: Course; score: number; reason: string; reasonType: 'search' | 'enrolled' | 'previewed' | 'popular' | 'grade' | 'trending' }> => {
    if (lessons.length === 0) return [];

    const recommendedSet = new Map<string, { course: Course; score: number; reason: string; reasonType: 'search' | 'enrolled' | 'previewed' | 'popular' | 'grade' | 'trending' }>();

    // Pre-compute enrolled and previewed data once outside the loop
    const enrolledCourses = lessons.filter(c => c.enrolled);
    const enrolledSubjects = enrolledCourses.map(c => c.subject.toLowerCase());
    const enrolledTerms    = enrolledCourses.map(c => c.term.toLowerCase());

    // Time-decayed previewed subjects: index 0 = most-recently-previewed = highest weight
    const previewedWithRecency = previewedlessons.map((id, idx) => ({
      subject: lessons.find(c => c.id === id)?.subject.toLowerCase() ?? '',
      weight: Math.max(0.3, 1 - idx * 0.1),
    }));

    // Last 10 search terms, index 0 = most recent
    const recentSearchTerms = searchHistory.slice(0, 10).map(s => s.toLowerCase());

    lessons.forEach(course => {
      if (course.enrolled) return;

      let score = 0;
      let topReason = '';
      let topReasonType: 'search' | 'enrolled' | 'previewed' | 'popular' | 'grade' | 'trending' = 'popular';
      const subjectLower = course.subject.toLowerCase();

      // 1. Search history — time-decayed, highest priority signal
      let bestSearchScore = 0;
      let bestSearchTerm = '';
      recentSearchTerms.forEach((term, idx) => {
        const decay = Math.max(0.4, 1 - idx * 0.07);
        const words = term.split(/\s+/).filter(w => w.length > 2);
        const wordHits = words.filter(w => subjectLower.includes(w) || w.includes(subjectLower));
        const exactBonus = subjectLower === term ? 20 : (subjectLower.includes(term) || term.includes(subjectLower) ? 10 : 0);
        const s = ((wordHits.length / Math.max(words.length, 1)) * 45 + exactBonus) * decay;
        if (s > bestSearchScore) { bestSearchScore = s; bestSearchTerm = term; }
      });
      if (bestSearchScore > 0) {
        score += bestSearchScore;
        topReason = `Based on "${bestSearchTerm.length > 22 ? bestSearchTerm.slice(0, 22) + '\u2026' : bestSearchTerm}"`;
        topReasonType = 'search';
      }

      // 2. Previewed subjects — recency-weighted
      let bestPreviewScore = 0;
      for (const p of previewedWithRecency) {
        if (!p.subject) continue;
        if (subjectLower.includes(p.subject) || p.subject.includes(subjectLower)) {
          bestPreviewScore = Math.max(bestPreviewScore, 35 * p.weight);
        }
      }
      if (bestPreviewScore > 0) {
        score += bestPreviewScore;
        if (!topReason) { topReason = 'You previewed something similar'; topReasonType = 'previewed'; }
      }

      // 3. Enrolled subject affinity
      if (enrolledSubjects.some(s => subjectLower.includes(s) || s.includes(subjectLower))) {
        score += 30;
        if (!topReason) { topReason = 'Similar to your lessons'; topReasonType = 'enrolled'; }
      }
      if (enrolledTerms.includes(course.term.toLowerCase())) score += 8;

      // 4. Grade match
      if (course.grade === studentGrade) {
        score += 12;
        if (!topReason) { topReason = 'Matches your grade'; topReasonType = 'grade'; }
      }

      // 5. Ready for next level
      const completedInGrade = enrolledCourses.filter(c => c.grade === studentGrade && c.completionRate > 80).length;
      if (completedInGrade >= 2) {
        const nextGrade = studentGrade === 'Common Entrance' ? '6' :
          studentGrade === '6' ? 'Common Entrance' : String(Number(studentGrade) + 1);
        if (course.grade === nextGrade) {
          score += 15;
          if (!topReason) { topReason = 'Ready for next level'; topReasonType = 'grade'; }
        }
      }

      // 6. Popularity and rating signals
      if (course.studentCount > 100) { score += 18; if (!topReason) { topReason = 'Trending now'; topReasonType = 'popular'; } }
      else if (course.studentCount > 50) { score += 12; if (!topReason) { topReason = 'Popular with students'; topReasonType = 'popular'; } }
      if (course.rating >= 4.7) { score += 12; if (!topReason) { topReason = 'Highly rated'; topReasonType = 'trending'; } }
      else if (course.rating >= 4.5) { score += 8; if (!topReason) { topReason = 'Highly rated'; topReasonType = 'trending'; } }

      // 7. Content richness
      if (course.lessonCount >= 8) score += 5;
      if (course.quizCount >= 3)   score += 3;

      if (score > 0) {
        if (!topReason) topReason = 'Recommended for you';
        recommendedSet.set(course.id, { course, score, reason: topReason, reasonType: topReasonType });
      }
    });

    return Array.from(recommendedSet.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 24);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recommendations = useMemo(() => getRecommendedlessons(), [lessons, previewedlessons, searchHistory, studentGrade]);
  const totalRecommendationPages = Math.ceil(recommendations.length / recommendationItemsPerPage);
  const paginatedRecommendations = recommendations.slice(
    (currentRecommendationPage - 1) * recommendationItemsPerPage,
    currentRecommendationPage * recommendationItemsPerPage,
  );

  // Debounced search with better suggestions - shows actual lessons
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        const query = searchQuery.toLowerCase();
        const suggestions = lessons
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
  }, [searchQuery, lessons, user, selectedGrade, selectedSubject, selectedTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    document.title = 'Browse Lessons | Mindsta';
    return () => { document.title = 'Mindsta'; };
  }, []);

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
    
    // Load previewed lessons
    const savedPreviewed = localStorage.getItem('previewedlessons');
    if (savedPreviewed) {
      setPreviewedlessons(JSON.parse(savedPreviewed));
    }
    
    // Extract user interests from enrollments
    if (enrollments.length > 0) {
      const interests = Array.from(new Set(enrollments.map(e => e.subject)));
      setUserInterests(interests);
    }
  }, [enrollments]);

  // Define callback functions first before useEffects
  const filterAndSortlessons = useCallback(() => {
    let filtered = [...lessons];

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

    // Only apply price filtering when the user explicitly changes the slider.
    if (isPriceFilterActive) {
      filtered = filtered.filter(course =>
        course.price >= priceRange[0] && course.price <= priceRange[1]
      );
    }

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

    setFilteredlessons(filtered);
  }, [lessons, showOnlyPurchased, showFreeOnly, searchQuery, selectedTopic, selectedGrade, selectedSubject, selectedTerm, sortBy, selectedDifficulties, minRating, priceRange, selectedCategory, isPriceFilterActive]);

  // Reset to page 1 whenever the filtered list or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredlessons, searchQuery]);

  useEffect(() => {
    setCurrentRecommendationPage(1);
  }, [recommendations.length]);

  useEffect(() => {
    if (currentRecommendationPage > totalRecommendationPages && totalRecommendationPages > 0) {
      setCurrentRecommendationPage(totalRecommendationPages);
    }
  }, [currentRecommendationPage, totalRecommendationPages]);

  const updateAvailableSubjects = useCallback(() => {
    // Filter lessons by selected grade first, then extract unique subjects
    let lessonsToCheck = [...lessons];
    
    // If a specific grade is selected, only get subjects for that grade
    if (selectedGrade !== 'all') {
      lessonsToCheck = lessonsToCheck.filter(course => course.grade === selectedGrade);
    }
    
    // Extract unique subjects from the filtered lessons
    const subjectsSet = new Set(lessonsToCheck.map(course => course.subject));
    const sortedSubjects = Array.from(subjectsSet).sort();
    
    // Only update if we have subjects OR if lessons are loaded
    if (sortedSubjects.length > 0 || lessons.length > 0) {
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
  }, [lessons, selectedGrade, selectedSubject]);

  const fetchStudentInfo = useCallback(async () => {
    if (!user?.id) return;
    // Note: enrollments are already seeded from localStorage in useState initializer,
    // so no need to re-apply cache here. Just fetch fresh data from the API.
    
    try {
      const [studentResult, progressResult, enrollmentsResult] = await Promise.allSettled([
        getStudentByUserId(user.id),
        getUserProgress(user.id),
        getEnrollments()
      ]);

      const studentData = studentResult.status === 'fulfilled' ? studentResult.value : null;
      const progress = progressResult.status === 'fulfilled' ? progressResult.value : [];
      const enrollmentsData = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : [];

      if (studentResult.status !== 'fulfilled') {
        console.warn('Warning: Failed to load student profile.', studentResult.reason);
      }
      if (progressResult.status !== 'fulfilled') {
        console.warn('Warning: Failed to load user progress.', progressResult.reason);
      }
      if (enrollmentsResult.status !== 'fulfilled') {
        console.warn('Warning: Failed to load enrollments.', enrollmentsResult.reason);
      }

      // Cache enrollments to localStorage for faster subsequent loads
      localStorage.setItem('user_enrollments', JSON.stringify(enrollmentsData));
      enrollmentsRef.current = enrollmentsData;

      if (studentData?.grade) {
        setStudentGrade(studentData.grade);
      }
      setUserProgress(progress || []);
      setEnrollments(enrollmentsData || []);

      // Re-stamp any lessons already in state with the fresh enrollments
      setlessons(prevlessons => {
        if (prevlessons.length === 0) return prevlessons;
        return prevlessons.map(course => ({
          ...course,
          enrolled: (enrollmentsData || []).some(e => isEnrolledUtil(e, course.subject, course.grade, course.term, course.lessonId)),
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
        fetchStudentInfo();
      }
    };
    
    const handleWindowFocus = () => {
      if (user?.id && shouldRefetch()) {
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

  // Keep enrollmentsRef always current so fetchlessonsForGrade never reads stale data
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

    // Use functional update to always work on the latest lessons list (avoids stale closure)
    setlessons(prev => {
      if (prev.length === 0) return prev;
      const updated = prev.map(course => ({
        ...course,
        enrolled: enrollments.some(e => isEnrolledUtil(e, course.subject, course.grade, course.term, course.lessonId)),
      }));
      const changed = updated.some((c, i) => c.enrolled !== prev[i].enrolled);
      return changed ? updated : prev;
    });
  }, [enrollments]); // lessons no longer needed as dep since we use functional update

  useEffect(() => {
    // Load ALL lessons at once (same approach as My Learning) once user + enrollments are ready
    if (!authLoading && user?.id && enrollments !== null && loadedGradesRef.current.size === 0 && !isFetchingRef.current) {
      fetchAllLessonsAtOnce();
    } else if (!authLoading && !user?.id) {
      setLoading(false);
    }
  }, [authLoading, user?.id, enrollments]);

  // Separate effect for fetching a single grade when user explicitly switches grade filter
  // (only needed if lessons haven't loaded yet for some reason)
  useEffect(() => {
    if (selectedGrade !== 'all' && !loadedGrades.has(selectedGrade) && loadedGrades.size > 0) {
      fetchlessonsForGrade(selectedGrade);
    }
  }, [selectedGrade]);

  // Fetch review stats in background once lessons are loaded (batch, 3 at a time)
  useEffect(() => {
    if (lessons.length === 0) return;
    const uncached = lessons.filter(c => reviewCache[c.id] === undefined);
    if (uncached.length === 0) return;

    const fetchBatch = async () => {
      // Take first 6 uncached to avoid too many parallel requests
      const batch = uncached.slice(0, 6);
      const results = await Promise.allSettled(
        batch.map(c => getRatingStats(c.id))
      );
      const updates: Record<string, { avg: number; total: number }> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          updates[batch[i].id] = { avg: r.value.averageRating ?? r.value.average ?? 0, total: r.value.totalReviews ?? r.value.total ?? 0 };
        } else {
          updates[batch[i].id] = { avg: 0, total: 0 };
        }
      });
      setReviewCache(prev => ({ ...prev, ...updates }));
      // Also update the rating on the course objects
      setlessons(prev => prev.map(c => {
        if (updates[c.id]) {
          return { ...c, rating: updates[c.id].avg || c.rating, reviewCount: updates[c.id].total };
        }
        return c;
      }));
    };

    fetchBatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons.length]); // only re-run when course count changes

  useEffect(() => {
    filterAndSortlessons();
  }, [filterAndSortlessons]);

  useEffect(() => {
    updateAvailableSubjects();
  }, [updateAvailableSubjects]);

  useEffect(() => {
    // Keep the default price range aligned with available data without enabling filtering.
    if (!isPriceFilterActive) {
      setPriceRange([0, maxPriceLimit]);
    } else {
      setPriceRange(([min, max]) => [min, Math.min(max, maxPriceLimit)]);
    }
  }, [maxPriceLimit, isPriceFilterActive]);

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


  /**
   * Fetch ALL lessons and ALL quizzes in 2 parallel requests — same approach as My Learning.
   * This replaces the old per-grade waterfall (7 × 2 = 14 requests → 2 requests total).
   */
  const fetchAllLessonsAtOnce = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Fetch enrollment counts + all lessons + all quizzes in parallel
      const [allLessons, allQuizzes] = await Promise.all([
        getLessons().catch(err => {
          console.error('[Browselessons] lessons fetch failed:', err);
          return [] as Lesson[];
        }),
        getQuizzesByFilters().catch(() => [] as any[]),
      ]);

      // Fetch enrollment counts once
      if (Object.keys(enrollmentCountsRef.current).length === 0) {
        try {
          const { api: _api } = await import('@/lib/apiClient');
          const counts = await _api.get('/subjects/enrollment-counts');
          if (counts && typeof counts === 'object') {
            enrollmentCountsRef.current = counts;
            setEnrollmentCounts(counts);
          }
        } catch (err) {
          console.error('[Browselessons] Could not fetch enrollment counts:', err);
        }
      }

      // Build quiz count map: lessonId → count
      const quizCountMap: Record<string, number> = {};
      for (const quiz of allQuizzes) {
        if (quiz.lessonId) quizCountMap[quiz.lessonId] = (quizCountMap[quiz.lessonId] || 0) + 1;
      }

      const allCourses: Course[] = [];
      const subjectsSet = new Set<string>();

      for (const lesson of allLessons) {
        subjectsSet.add(lesson.subject);

        const gradeValue = lesson.grade;
        const lessonEnrollCount = enrollmentCountsRef.current[`lesson|${lesson.id}`] || 0;
        const subjectEnrollCount = enrollmentCountsRef.current[`${lesson.subject}|${gradeValue}|${lesson.term}`] || 0;
        const studentCount = lessonEnrollCount || subjectEnrollCount;

        const enrolled = enrollmentsRef.current.some(e =>
          isEnrolledUtil(e, lesson.subject, gradeValue, lesson.term, lesson.id)
        );

        const lessonDuration = lesson.duration || 30;
        const durationDisplay = lessonDuration >= 60
          ? `${Math.ceil(lessonDuration / 60)}h`
          : `${lessonDuration}m`;
        const lessonCompleted = userProgress.some(p => p.lessonId === lesson.id && p.completed);

        const validDifficulty = lesson.difficulty &&
          ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard', 'Beginner', 'Intermediate', 'Advanced'].includes(lesson.difficulty)
          ? lesson.difficulty as Course['difficulty']
          : 'beginner' as const;

        allCourses.push({
          id: lesson.id,
          subject: lesson.subject,
          grade: gradeValue,
          term: lesson.term,
          lessonTitle: lesson.title,
          lessonId: lesson.id,
          lessonCount: 1,
          quizCount: quizCountMap[lesson.id] || 0,
          description: lesson.description?.trim() || '',
          difficulty: validDifficulty,
          estimatedHours: Math.ceil(lessonDuration / 60),
          durationDisplay,
          completionRate: lessonCompleted ? 100 : 0,
          enrolled,
          price: lesson.price ?? 0,
          rating: lesson.rating ?? 0,
          studentCount,
          imageUrl: lesson.imageUrl || undefined,
          topics: [lesson.title],
          lessonIds: [lesson.id],
          reviewCount: 0,
          createdAt: lesson.createdAt,
        });
      }

      setAvailableSubjects(Array.from(subjectsSet).sort());

      // Mark all grades as loaded
      const allGrades = new Set(grades);
      setLoadedGrades(allGrades);
      loadedGradesRef.current = allGrades;

      setlessons(allCourses);
      isInitialLoad.current = false;
    } catch (error) {
      console.error('[Browselessons] Error fetching all lessons:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchlessonsForGrade = async (grade: string) => {
    // Per-grade deduplication: skip if already loaded
    if (loadedGradesRef.current.has(grade)) return;
    // Mark as in-flight immediately (before any await) to prevent duplicate concurrent calls
    isFetchingRef.current = true;

    try {
      // Show the main loading spinner only on the very first load (before any grade is loaded)
      setLoading(loadedGradesRef.current.size === 0);

      const gradeValue = grade === "Common Entrance" ? "Common Entrance" : grade;
      const newlessons: Course[] = [];
      const subjectsSet = new Set<string>();

      // Fetch enrollment counts once (shared across all grades)
      if (Object.keys(enrollmentCountsRef.current).length === 0) {
        try {
          const { api } = await import('@/lib/apiClient');
          const counts = await api.get('/subjects/enrollment-counts');
          if (counts && typeof counts === 'object') {
            enrollmentCountsRef.current = counts;
            setEnrollmentCounts(counts);
          }
        } catch (err) {
          console.error('[Browselessons] Could not fetch enrollment counts:', err);
        }
      }

      // Fetch all lessons + quizzes for this grade in parallel (2 requests total)
      const [gradeLessons, gradeQuizzes] = await Promise.all([
        getLessons(undefined, gradeValue).catch(err => {
          console.error(`[Browselessons] lessons fetch failed for grade ${gradeValue}:`, err);
          return [] as Lesson[];
        }),
        getQuizzesByFilters(undefined, gradeValue).catch(() => [] as any[]),
      ]);

      const quizCountMap: Record<string, number> = {};
      for (const quiz of gradeQuizzes) {
        if (quiz.lessonId) quizCountMap[quiz.lessonId] = (quizCountMap[quiz.lessonId] || 0) + 1;
      }

      for (const lesson of gradeLessons) {
        subjectsSet.add(lesson.subject);

        const lessonEnrollCount = enrollmentCountsRef.current[`lesson|${lesson.id}`] || 0;
        const subjectEnrollCount = enrollmentCountsRef.current[`${lesson.subject}|${gradeValue}|${lesson.term}`] || 0;
        const studentCount = lessonEnrollCount || subjectEnrollCount;

        const enrolled = enrollmentsRef.current.some(e =>
          isEnrolledUtil(e, lesson.subject, gradeValue, lesson.term, lesson.id)
        );

        const lessonDuration = lesson.duration || 30;
        const durationDisplay = lessonDuration >= 60
          ? `${Math.ceil(lessonDuration / 60)}h`
          : `${lessonDuration}m`;
        const lessonCompleted = userProgress.some(p => p.lessonId === lesson.id && p.completed);

        const validDifficulty = lesson.difficulty &&
          ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard', 'Beginner', 'Intermediate', 'Advanced'].includes(lesson.difficulty)
          ? lesson.difficulty as Course['difficulty']
          : 'beginner' as const;

        newlessons.push({
          id: lesson.id,
          subject: lesson.subject,
          grade,
          term: lesson.term,
          lessonTitle: lesson.title,
          lessonId: lesson.id,
          lessonCount: 1,
          quizCount: quizCountMap[lesson.id] || 0,
          description: lesson.description?.trim() || '',
          difficulty: validDifficulty,
          estimatedHours: Math.ceil(lessonDuration / 60),
          durationDisplay,
          completionRate: lessonCompleted ? 100 : 0,
          enrolled,
          price: lesson.price ?? 0,
          rating: lesson.rating ?? 0,
          studentCount,
          imageUrl: lesson.imageUrl || undefined,
          topics: [lesson.title],
          lessonIds: [lesson.id],
          reviewCount: 0,
          createdAt: lesson.createdAt,
        });
      }

      // Merge with existing subjects instead of replacing
      setAvailableSubjects(prev => {
        const merged = new Set([...prev, ...Array.from(subjectsSet)]);
        return Array.from(merged).sort();
      });
      
      // Merge lessons while preserving / correcting enrolled status
      setlessons(prev => {
        const existingCourseMap = new Map(prev.map(c => [c.id, c]));
        const updatedlessons = [...prev];
        
        newlessons.forEach(newCourse => {
          // Always re-check via the ref — this is the ONLY source of truth for enrolled status
          // regardless of what value was computed in the stale closure above.
          const isEnrolledNow = enrollmentsRef.current.some(e =>
            isEnrolledUtil(e, newCourse.subject, newCourse.grade, newCourse.term, newCourse.lessonId)
          );
          const courseWithCorrectStatus = { ...newCourse, enrolled: isEnrolledNow };

          const existing = existingCourseMap.get(newCourse.id);
          if (existing) {
            const index = updatedlessons.findIndex(c => c.id === newCourse.id);
            updatedlessons[index] = courseWithCorrectStatus;
          } else {
            updatedlessons.push(courseWithCorrectStatus);
          }
        });
        
        return updatedlessons;
      });
      
      setLoadedGrades(prev => new Set([...prev, grade]));
      loadedGradesRef.current = new Set([...loadedGradesRef.current, grade]);
      
      // Mark initial load done so subsequent grade fetches don't show the full-screen spinner
      isInitialLoad.current = false;
    } catch (error) {
      console.error(`Error fetching lessons for grade ${grade}:`, error);
      toast({
        title: "Error",
        description: `Failed to load lessons for grade ${grade}.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchlessons = async () => {
    // Legacy fallback — use the bulk loader
    await fetchAllLessonsAtOnce();
  };

  const handleAddToCart = (course: Course) => {
    // Prevent adding purchased lessons to cart
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
      price: course.price,
      lessonId: course.lessonId, // pass the specific lesson ID for per-lesson enrollment
      title: course.lessonTitle || course.subject,
    });

    // Cache thumbnail so the cart dialog (StudentHeader hover card) can show the real image
    const imgUrl = course.imageUrl || course.thumbnail || '';
    if (imgUrl) {
      const imgKey = course.lessonId
        ? `cart_img_lesson:${course.lessonId}`
        : `cart_img_subj:${encodeURIComponent(course.subject)}:${course.grade}:${encodeURIComponent(course.term || '')}`;
      try { localStorage.setItem(imgKey, imgUrl); } catch { /* storage full – ignore */ }
    }

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
    if (isInWishlist(course.subject, course.grade, course.term)) {
      // Find the actual MongoDB subdocument _id so the backend can remove the right item
      const item = wishlist?.items.find(
        i => i.subject === course.subject && i.grade === course.grade && i.term === course.term
      );
      if (item) removeFromWishlist(item._id);
    } else {
      addToWishlist({ subject: course.subject, grade: course.grade, term: course.term });
    }
  };

  const handleViewCourse = (course: Course) => {
    if (course.enrolled) {
      // Navigate to course lessons if already purchased, pre-selecting the specific lesson
      const params = new URLSearchParams();
      if (course.term) params.set('term', course.term);
      if (course.lessonId) params.set('lessonId', course.lessonId);
      const qs = params.toString();
      navigate(`/subjects/${course.grade}/${course.subject}${qs ? `?${qs}` : ''}`);
    } else {
      // Add to cart if not purchased
      handleAddToCart(course);
    }
  };

  const handlePreviewCourse = async (course: Course) => {
    setLoadingPreviewId(course.id);
    
    // Track this preview for recommendations
    setPreviewedlessons(prev => {
      const updated = [course.id, ...prev.filter(id => id !== course.id)].slice(0, 30);
      localStorage.setItem('previewedlessons', JSON.stringify(updated));
      return updated;
    });
    
    try {
      // If this card represents a single specific lesson, fetch only that lesson.
      // Otherwise fetch all lessons for the subject/grade/term.
      let lessons: Lesson[];
      if (course.lessonId) {
        const single = await getLessonPreviewById(course.lessonId);
        lessons = single ? [single] : [];
      } else {
        lessons = await getLessonsBySubjectAndGrade(course.subject, course.grade, course.term);
      }

      // Build a preview from the API data if available, otherwise fall back to the card data
      const buildComposite = (lessonList: Lesson[]): Lesson => {
        if (lessonList.length > 0) {
          return {
            id: lessonList[0].id,
            title: course.lessonId ? (lessonList[0].title || course.subject) : course.subject,
            subtitle: `Grade ${course.grade}${course.term ? ` • ${course.term}` : ''}`,
            description: lessonList[0].description || course.description,
            subject: course.subject,
            grade: course.grade,
            term: lessonList[0].term,
            difficulty: (lessonList[0].difficulty || course.difficulty) as Lesson['difficulty'],
            duration: lessonList.reduce((sum, l) => sum + (l.duration || 0), 0),
            imageUrl: course.imageUrl || lessonList[0].imageUrl,
            whatYouWillLearn: lessonList[0].whatYouWillLearn,
            requirements: lessonList[0].requirements,
            targetAudience: lessonList[0].targetAudience,
            learningObjectives: lessonList[0].learningObjectives,
            price: course.price,
            rating: course.rating,
            ratingsCount: course.reviewCount || 0,
            enrolledStudents: course.studentCount,
            createdAt: lessonList[0].createdAt,
            quizCount: course.quizCount,
            curriculum: lessonList.map((lesson, idx) => ({
              title: lesson.title,
              description: lesson.description,
              order: idx,
              lectures: lesson.curriculum && lesson.curriculum.length > 0
                ? lesson.curriculum.flatMap(section => section.lectures)
                : [{
                    title: lesson.title,
                    type: 'video' as const,
                    duration: lesson.duration || 30,
                    order: 0,
                    isPreview: idx === 0,
                  }],
            })),
          };
        }
        // Fallback: build from card data when API returned nothing
        return {
          id: course.id,
          title: course.lessonTitle || course.subject,
          subtitle: `Grade ${course.grade}${course.term ? ` • ${course.term}` : ''}`,
          description: course.description,
          subject: course.subject,
          grade: course.grade,
          term: course.term,
          difficulty: course.difficulty as Lesson['difficulty'],
          duration: course.estimatedHours * 60,
          imageUrl: course.imageUrl,
          price: course.price,
          rating: course.rating,
          ratingsCount: course.reviewCount || 0,
          enrolledStudents: course.studentCount,
          createdAt: course.createdAt,
          quizCount: course.quizCount,
          curriculum: [{
            title: course.lessonTitle || course.subject,
            description: course.description,
            order: 0,
            lectures: [{
              title: course.lessonTitle || course.subject,
              type: 'video' as const,
              duration: course.estimatedHours * 60 || 30,
              order: 0,
              isPreview: true,
            }],
          }],
        };
      };

      setSelectedCourseForPreview(buildComposite(lessons));
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error loading course preview:', error);
      // Even on hard error, show the dialog with whatever card data we have
      const fallback: Lesson = {
        id: course.id,
        title: course.lessonTitle || course.subject,
        subtitle: `Grade ${course.grade}${course.term ? ` • ${course.term}` : ''}`,
        description: course.description,
        subject: course.subject,
        grade: course.grade,
        term: course.term,
        difficulty: course.difficulty as Lesson['difficulty'],
        duration: course.estimatedHours * 60,
        imageUrl: course.imageUrl,
        price: course.price,
        rating: course.rating,
        ratingsCount: course.reviewCount || 0,
        enrolledStudents: course.studentCount,
        createdAt: course.createdAt,
        quizCount: course.quizCount,
        curriculum: [],
      };
      setSelectedCourseForPreview(fallback);
      setPreviewDialogOpen(true);
    } finally {
      setLoadingPreviewId(null);
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
    setPriceRange([0, maxPriceLimit]);
    setIsPriceFilterActive(false);
  };

  // Returns the enrolled course that was most recently accessed
  const getLastAccessedCourse = (): Course | null => {
    if (!userProgress.length || !lessons.length) return null;
    const sorted = [...userProgress]
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    if (!sorted.length) return null;
    return lessons.find(c => (c.lessonIds ?? []).includes(sorted[0].lessonId) && c.enrolled) ?? null;
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
    for (const c of lessons) {
      const idx = (c.lessonIds ?? []).indexOf(lastLessonId);
      if (idx !== -1 && (c.topics ?? [])[idx]) return (c.topics ?? [])[idx];
    }
    return null;
  };

  // "Students also bought" — unenrolled lessons from same grade or subject
  // Scored: same grade + same subject (4pts), same grade only (2pts), same subject only (1pt)
  const getAlsoBoughtlessons = (source: Course): Course[] => {
    return lessons
      .filter(c =>
        !c.enrolled &&
        !isInCart(c.subject, c.grade, c.term, c.lessonId) &&
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

  // Build a map of subject name → lessons for the sidebar (dynamic, from DB)
  const getCategoryMap = (): Record<string, Course[]> => {
    const map: Record<string, Course[]> = {};
    lessons.forEach(c => {
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
        {/* Compact Hero / Page Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium">Course Library</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Browse Lessons</h1>
                <p className="text-indigo-100 text-sm max-w-lg">
                  {loading
                    ? 'Loading lessons…'
                    : `${new Set(lessons.map(c => c.subject)).size} subjects · ${lessons.length}+ lessons across all grades`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-4">
                  {[
                    { label: 'Subjects', value: new Set(lessons.map(c => c.subject)).size, icon: BookOpen },
                    { label: 'Enrolled', value: enrollments.length, icon: CheckCircle },
                    { label: 'Students', value: totalStudents > 0 ? totalStudents.toLocaleString() : '—', icon: Users },
                  ].map((s, i) => (
                    <div key={i} className="hidden sm:flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20 min-w-[70px]">
                      <s.icon className="w-4 h-4 text-indigo-200 mb-1" />
                      <span className="text-white font-bold text-lg leading-none">{s.value}</span>
                      <span className="text-indigo-200 text-xs mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
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
                      <p className="font-bold text-foreground truncate text-lg leading-tight">{lastCourse.lessonTitle || lastCourse.subject}</p>
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
                    onClick={() => {
                      const p = new URLSearchParams();
                      if (lastCourse.term) p.set('term', lastCourse.term);
                      if (lastCourse.lessonId) p.set('lessonId', lastCourse.lessonId);
                      navigate(`/subjects/${lastCourse.grade}/${lastCourse.subject}${p.toString() ? `?${p}` : ''}`);
                    }}
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
            <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Quick Filter Tabs */}
            <div className="mb-6">
              <Tabs value={showOnlyPurchased ? "purchased" : "all"} onValueChange={(v) => setShowOnlyPurchased(v === "purchased")} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-purple-100 dark:bg-purple-900/30">
                  <TabsTrigger value="all" className="text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                    All lessons ({lessons.length})
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
                  placeholder="Search lessons, topics, subjects, grades…"
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
                                    {course.lessonTitle || course.subject}
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

            {/* ── Mobile Filter Toggle Row ── */}
            <div className="flex sm:hidden items-center gap-2 mb-4">
              <button
                onClick={() => setShowMobileFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all flex-1 justify-center ${
                  showMobileFilters
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 text-foreground'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(selectedGrade !== 'all' || selectedSubject !== 'all' || selectedTerm !== 'all' || selectedTopic || showFreeOnly) && (
                  <span className="ml-1 min-w-[20px] h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {[selectedGrade !== 'all', selectedSubject !== 'all', selectedTerm !== 'all', !!selectedTopic, showFreeOnly].filter(Boolean).length}
                  </span>
                )}
                {showMobileFilters ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
              </button>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-10 border-2 border-gray-200 dark:border-gray-700 rounded-xl w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="newest">Most Lessons</SelectItem>
                  <SelectItem value="alphabetical">A–Z</SelectItem>
                  <SelectItem value="price-low">Price ↑</SelectItem>
                  <SelectItem value="price-high">Price ↓</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Desktop Filters (always visible) / Mobile Filters (collapsible) ── */}
            <AnimatePresence initial={false}>
              {(
                <motion.div
                  key="filters-panel"
                  initial={false}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`${showMobileFilters ? 'block' : 'hidden sm:block'}`}
                >
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
                          <SelectItem value="all">All Grades ({lessons.length})</SelectItem>
                          {grades.map((grade) => {
                            const count = lessons.filter(c => c.grade === grade).length;
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
                            const count = lessons.filter(c =>
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
                            const count = lessons.filter(c =>
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

                  {/* Free-Only toggle */}
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setShowFreeOnly(!showFreeOnly)}
                      className={`flex items-center gap-2 px-4 h-10 rounded-lg border-2 text-sm font-semibold transition-all whitespace-nowrap ${
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── View Mode Toggle & Advanced Filters ── */}
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
                        {!isPriceFilterActive && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">(not applied)</span>
                        )}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max={maxPriceLimit}
                          step="500"
                          value={priceRange[1]}
                          onChange={(e) => {
                            const selectedMax = Number(e.target.value);
                            setPriceRange([0, selectedMax]);
                            setIsPriceFilterActive(selectedMax < maxPriceLimit);
                          }}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>₦0</span>
                          <span>{formatCurrency(maxPriceLimit)}</span>
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
                        setPriceRange([0, maxPriceLimit]);
                        setIsPriceFilterActive(false);
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
                    {filteredlessons.length === 0
                      ? 'No results'
                      : filteredlessons.length === 1
                        ? '1 result'
                        : `${filteredlessons.length} results`}
                    <span className="font-normal text-muted-foreground">for</span>
                    <span className="italic text-purple-600 dark:text-purple-400 truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">&ldquo;{searchQuery}&rdquo;</span>
                    {isLoadingBackground && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All matching lessons are shown below &mdash; no pagination while searching
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {filteredlessons.length > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1.5 border-purple-300 text-purple-700">
                      <BookOpen className="w-3 h-3" />
                      {filteredlessons.filter(c => !c.enrolled).length} available
                    </Badge>
                    {filteredlessons.filter(c => c.enrolled).length > 0 && (
                      <Badge variant="outline" className="gap-1.5 border-green-300 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        {filteredlessons.filter(c => c.enrolled).length} owned
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
                  <span className="text-lg font-medium">Loading amazing lessons...</span>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    {filteredlessons.length === 0 ? 'No lessons Found' :
                     filteredlessons.length === 1 ? '1 Course Available' :
                     `${filteredlessons.length} Lessons Available`}
                    {isLoadingBackground && (
                      <span title="Loading more lessons in background">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {enrollments.length} enrolled • {filteredlessons.filter(c => !c.enrolled).length} available
                    {isLoadingBackground && (
                      <> • Loading more grades...</>
                    )}
                  </p>
                </div>
              )}
            </div>
            {!loading && filteredlessons.length > 0 && (
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
          {showSidebar && !loading && lessons.length > 0 && (() => {
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
                        const catlessons = catMap[subject] ?? [];
                        if (catlessons.length === 0) return null;
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
                              <p className="text-xs text-muted-foreground">{catlessons.length} course{catlessons.length !== 1 ? 's' : ''}</p>
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

        {/* Students Also Bought — fixed bottom panel (rendered via portal at bottom of page) */}

        {/* lessons Grid - Redesigned */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                {/* Mobile horizontal skeleton */}
                <div className="sm:hidden rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex h-[108px]">
                  <div className="w-[100px] flex-shrink-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/50 dark:via-pink-900/40 dark:to-blue-900/50 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" />
                  </div>
                  <div className="flex-1 p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    <div className="flex gap-1.5">
                      <div className="h-5 bg-muted rounded-full w-12 animate-pulse" />
                      <div className="h-5 bg-muted rounded-full w-12 animate-pulse" />
                    </div>
                    <div className="flex gap-2 items-center justify-between mt-auto">
                      <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                      <div className="h-7 bg-muted rounded-lg w-20 animate-pulse" />
                    </div>
                  </div>
                </div>
                {/* Desktop rich skeleton */}
                <Card className="hidden sm:block overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/50 dark:via-pink-900/40 dark:to-blue-900/50">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" />
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded-lg w-3/4 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-muted rounded w-full animate-pulse" />
                      <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-12 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-muted rounded-lg flex-1 animate-pulse" />
                      <div className="h-10 bg-muted rounded-lg flex-1 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : lessons.length === 0 && !loading && !isLoadingBackground ? (
          // No lessons in database at all
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
        ) : filteredlessons.length === 0 ? (
          // lessons exist but filters returned nothing
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
                      ? "You haven't purchased any lessons yet"
                      : "No lessons Found"}
                </h3>
                <p className="text-muted-foreground mb-6 text-base">
                  {searchQuery
                    ? `We couldn't find any lessons matching "${searchQuery}". Try searching with different keywords or check your spelling.`
                    : showOnlyPurchased
                      ? "Browse our available lessons and start learning today!"
                      : selectedGrade !== 'all' || selectedSubject !== 'all' || selectedTerm !== 'all'
                        ? `No lessons found for ${selectedGrade !== 'all' ? `Grade ${selectedGrade}` : ''}${selectedSubject !== 'all' ? ` - ${selectedSubject}` : ''}${selectedTerm !== 'all' ? ` - ${selectedTerm}` : ''}. Try different filters.`
                        : "We couldn't find any lessons matching your criteria. Try adjusting your filters."}
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
                    {showOnlyPurchased ? 'View All lessons' : 'Clear All Filters'}
                  </Button>
                </div>
              </div>

              {/* Personalized suggestions for student's grade */}
              {(() => {
                const grade = studentGrade || selectedGrade;
                if (!grade || grade === 'all') return null;
                const suggestions = lessons
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
                    {/* Mobile: horizontal card list · Desktop: 4-col grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {suggestions.map(course => (
                        <div
                          key={course.id}
                          className="group cursor-pointer"
                          onClick={() => { clearFilters(); handleViewCourse(course); }}
                        >
                          {/* ── Mobile horizontal card ── */}
                          <div className="sm:hidden rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md flex items-stretch active:scale-[0.985] transition-all duration-150">
                            <div className="relative flex-shrink-0 w-[90px] bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 overflow-hidden">
                              {(course.imageUrl || course.thumbnail) && (
                                <img src={course.imageUrl || course.thumbnail} alt={course.subject} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                              )}
                              {!(course.imageUrl || course.thumbnail) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-white/80" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 p-3 flex flex-col gap-1">
                              <h4 className="font-bold text-[13px] leading-snug line-clamp-2 text-foreground group-hover:text-purple-600 transition-colors">
                                {course.lessonTitle || course.subject}
                              </h4>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {course.lessonTitle ? `${course.subject} · ` : ''}{course.grade === 'Common Entrance' ? 'CE' : `Gr. ${course.grade}`} · {course.term.replace(' Term', '')}
                              </p>
                              <div className="flex items-center gap-2 mt-auto">
                                {course.rating > 0 && (
                                  <div className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{course.rating.toFixed(1)}</span>
                                  </div>
                                )}
                                <span className="ml-auto text-sm font-extrabold text-purple-600 dark:text-purple-400">{formatCurrency(course.price)}</span>
                              </div>
                            </div>
                          </div>

                          {/* ── Desktop card (unchanged) ── */}
                          <Card className="hidden sm:block border hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all overflow-hidden">
                            <div className="h-14 flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 relative">
                              {(course.imageUrl || course.thumbnail) ? (
                                <img src={course.imageUrl || course.thumbnail} alt={course.subject} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <BookOpen className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <CardContent className="p-2.5">
                              <p className="font-semibold text-xs truncate group-hover:text-purple-600 transition-colors">{course.lessonTitle || course.subject}</p>
                              <p className="text-xs text-muted-foreground">{course.lessonTitle ? `${course.subject} · ` : ''}{course.term}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm font-bold text-purple-600">{formatCurrency(course.price)}</p>
                                {course.rating > 0 && (
                                  <div className="flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span className="text-[10px] font-semibold text-amber-600">{course.rating.toFixed(1)}</span>
                                  </div>
                                )}
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
          <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 mb-10"
          >
            {(searchQuery.trim() ? filteredlessons : filteredlessons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).map((course) => (
              <motion.div
                key={course.id}
                variants={fadeInUp}
              >
                {/* ── MOBILE: Horizontal compact card ── */}
                <div
                  className={`sm:hidden group rounded-2xl overflow-hidden border flex items-stretch cursor-pointer shadow-sm active:scale-[0.985] transition-all duration-150 ${
                    course.enrolled
                      ? 'border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-gray-900'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                  }`}
                  onClick={() => handleViewCourse(course)}
                >
                  {/* Left: Thumbnail */}
                  <div className={`relative flex-shrink-0 w-[100px] overflow-hidden ${
                    course.enrolled
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500'
                  }`}>
                    {(course.imageUrl || course.thumbnail) && (
                      <img
                        src={course.imageUrl || course.thumbnail}
                        alt={course.subject}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {/* Gradient overlay for enrolled cards */}
                    {course.enrolled && (
                      <div className="absolute inset-0 bg-green-600/20" />
                    )}
                    {/* Center icon fallback */}
                    {!(course.imageUrl || course.thumbnail) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-2xl font-extrabold text-white/90 leading-none">{course.subject.charAt(0).toUpperCase()}</span>
                        <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wide">{course.grade === 'Common Entrance' ? 'CE' : `Gr ${course.grade}`}</span>
                      </div>
                    )}
                    {/* Status badge */}
                    {course.enrolled ? (
                      <div className="absolute top-2 left-2">
                        <div className="bg-green-600/95 backdrop-blur-sm rounded-full p-0.5 shadow">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : isNewCourse(course.createdAt) ? (
                      <div className="absolute top-2 left-2">
                        <span className="bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase leading-none">New</span>
                      </div>
                    ) : isPopular(course) ? (
                      <div className="absolute top-2 left-2">
                        <span className="bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase leading-none">Hot</span>
                      </div>
                    ) : null}
                    {/* Progress arc for enrolled */}
                    {course.enrolled && course.completionRate > 0 && (
                      <div className="absolute bottom-2 right-2">
                        <div className="w-8 h-8 relative">
                          <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                            <circle cx="16" cy="16" r="12" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                            <circle
                              cx="16" cy="16" r="12"
                              stroke="white" strokeWidth="3" fill="none"
                              strokeDasharray={`${2 * Math.PI * 12}`}
                              strokeDashoffset={`${2 * Math.PI * 12 * (1 - course.completionRate / 100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white rotate-90">
                            {course.completionRate}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 min-w-0 p-3 flex flex-col gap-1.5">
                    {/* Title row + wishlist */}
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-[13px] leading-snug line-clamp-2 transition-colors ${
                          course.enrolled
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        }`}>
                          {course.lessonTitle || course.subject}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {course.lessonTitle ? `${course.subject} · ` : ''}
                          {course.grade === 'Common Entrance' ? 'CE' : `Gr. ${course.grade}`} · {course.term.replace(' Term', '')}
                        </p>
                      </div>
                      {!course.enrolled && (
                        <button
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors -mt-0.5"
                          onClick={(e) => { e.stopPropagation(); handleToggleWishlist(course); }}
                          title="Save to wishlist"
                        >
                          <Heart className={`w-3.5 h-3.5 transition-colors ${
                            isInWishlist(course.subject, course.grade, course.term)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`} />
                        </button>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {course.rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                        {course.durationDisplay || '30m'}
                      </span>
                      {course.quizCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                          <Trophy className="w-2.5 h-2.5 flex-shrink-0" />
                          {course.quizCount} quiz
                        </span>
                      )}
                    </div>

                    {/* Price + CTA — pinned to bottom */}
                    <div className="mt-auto pt-1">
                      {course.enrolled ? (
                        <button
                          className="w-full text-[12px] bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          onClick={(e) => { e.stopPropagation(); handleViewCourse(course); }}
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          {course.completionRate > 0 ? 'Continue' : 'Start Learning'}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
                            {formatCurrency(course.price)}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              className="text-[11px] border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 disabled:opacity-40 transition-colors"
                              onClick={(e) => { e.stopPropagation(); handlePreviewCourse(course); }}
                              disabled={loadingPreviewId === course.id}
                            >
                              {loadingPreviewId === course.id ? '…' : 'Preview'}
                            </button>
                            <button
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm ${
                                isInCart(course.subject, course.grade, course.term, course.lessonId)
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(course); }}
                            >
                              {isInCart(course.subject, course.grade, course.term, course.lessonId) ? '✓ Added' : 'Add'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── DESKTOP (sm+): Full rich card ── */}
                <Card className={`hidden sm:flex flex-col h-full group overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 ${
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
                          loading="lazy"
                          decoding="async"
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
                      {isNewCourse(course.createdAt) && !course.enrolled && (
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
                    
                    {/* Enrolled Ribbon - Top Right Corner */}
                    {course.enrolled && (
                      <div className="absolute top-0 right-0 z-20">
                        <div className="bg-green-600 text-white px-4 py-1.5 shadow-lg flex items-center gap-1.5 font-semibold text-xs rounded-bl-lg">
                          <CheckCircle className="w-3.5 h-3.5" />
                          ENROLLED
                        </div>
                      </div>
                    )}
                    
                    {!(course.imageUrl || course.thumbnail) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner">
                          <span className="text-4xl font-extrabold text-white leading-none">{course.subject.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{course.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${course.grade}`}</span>
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

                  <CardHeader className="pb-2 pt-4">
                    <div className="cursor-pointer" onClick={() => handleViewCourse(course)}>
                      {/* Rating row */}
                      <div className="flex items-center gap-1.5 mb-2">
                        {course.rating > 0 ? (
                          <>
                            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{course.rating.toFixed(1)}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.round(course.rating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            {course.reviewCount > 0 && (
                              <span className="text-xs text-muted-foreground">({course.reviewCount})</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ratings yet</span>
                        )}
                        {course.studentCount > 0 && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Users className="w-3 h-3" />
                              {course.studentCount.toLocaleString()} students
                            </span>
                          </>
                        )}
                      </div>
                      <CardTitle className="text-lg font-extrabold group-hover:text-purple-600 transition-colors line-clamp-2 leading-snug mb-1.5">
                        {course.lessonTitle || course.subject}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap mb-2">
                        {course.lessonTitle && (
                          <span className="font-semibold text-foreground/60">{course.subject}</span>
                        )}
                        {course.lessonTitle && <span>·</span>}
                        <div className="flex items-center gap-0.5">
                          <GraduationCap className="w-3 h-3 text-purple-500" />
                          <span>{course.grade === "Common Entrance" ? "Common Entrance" : `Grade ${course.grade}`}</span>
                        </div>
                        <span>·</span>
                        <span>{course.term}</span>
                        {course.durationDisplay && (
                          <>
                            <span>·</span>
                            <Clock className="w-3 h-3" />
                            <span>{course.durationDisplay}</span>
                          </>
                        )}
                        {course.quizCount > 0 && (
                          <>
                            <span>·</span>
                            <Trophy className="w-3 h-3" />
                            <span>{course.quizCount} quiz</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Enrolled lessons */}
                    {course.enrolled && course.completionRate > 0 && (
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-purple-600">Progress</span>
                          <span className="font-bold">{course.completionRate}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4 flex flex-col gap-3 mt-auto">
                    {/* Price, CTA, Preview */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                      {course.enrolled ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md font-bold"
                          onClick={() => handleViewCourse(course)}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          {course.completionRate > 0 ? 'Continue Learning' : 'Start Learning'}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
                              {formatCurrency(course.price)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-3"
                              onClick={() => handlePreviewCourse(course)}
                              disabled={loadingPreviewId === course.id}
                            >
                              {loadingPreviewId === course.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button 
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md font-bold"
                              size="sm"
                              onClick={() => handleAddToCart(course)}
                              disabled={isInCart(course.subject, course.grade, course.term, course.lessonId)}
                            >
                              {isInCart(course.subject, course.grade, course.term, course.lessonId) ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1.5" />
                                  In Cart
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                  Add to Cart
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination Controls — shown when not searching */}
          {!loading && !searchQuery.trim() && filteredlessons.length > itemsPerPage && (
            <div className="flex flex-col items-center gap-3 mt-10 pt-6 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredlessons.length)}–{Math.min(currentPage * itemsPerPage, filteredlessons.length)} of {filteredlessons.length} lesson{filteredlessons.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1 sm:gap-2">
                {Math.ceil(filteredlessons.length / itemsPerPage) > 5 && (
                  <Button variant="outline" size="sm" className="hidden sm:flex w-9 h-9 p-0"
                    onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage === 1} aria-label="First page">
                    «
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1 h-9 px-2.5 sm:px-3"
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="sr-only sm:not-sr-only">Prev</span>
                </Button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const totalPages = Math.ceil(filteredlessons.length / itemsPerPage);
                    const pages: number[] = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else if (currentPage <= 3) {
                      pages.push(1, 2, 3, -1, totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, -1, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
                    }
                    return pages.map((page, idx) => {
                      if (page < 0) return (
                        <span key={`e-${idx}`} className="hidden sm:inline-flex w-9 h-9 items-center justify-center text-muted-foreground text-sm">…</span>
                      );
                      const isCurrent = currentPage === page;
                      const showOnMobile = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
                      return (
                        <Button key={page} variant={isCurrent ? 'default' : 'outline'} size="sm"
                          onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`w-9 h-9 p-0 ${isCurrent ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm' : ''} ${!showOnMobile ? 'hidden sm:inline-flex' : ''}`}
                          aria-current={isCurrent ? 'page' : undefined}>
                          {page}
                        </Button>
                      );
                    });
                  })()}
                </div>

                <Button variant="outline" size="sm" className="gap-1 h-9 px-2.5 sm:px-3"
                  onClick={() => { setCurrentPage(p => Math.min(Math.ceil(filteredlessons.length / itemsPerPage), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage >= Math.ceil(filteredlessons.length / itemsPerPage)}>
                  <span className="sr-only sm:not-sr-only">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {Math.ceil(filteredlessons.length / itemsPerPage) > 5 && (
                  <Button variant="outline" size="sm" className="hidden sm:flex w-9 h-9 p-0"
                    onClick={() => { setCurrentPage(Math.ceil(filteredlessons.length / itemsPerPage)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage >= Math.ceil(filteredlessons.length / itemsPerPage)} aria-label="Last page">
                    »
                  </Button>
                )}
              </div>
            </div>
          )}
          </>
        )}



        {/* Results Summary — shown only during search */}
        {!loading && filteredlessons.length > 0 && searchQuery.trim() && (
          <div className="text-center pb-8">
            <p className="text-sm text-muted-foreground">
              {`Showing all ${filteredlessons.length} result${filteredlessons.length === 1 ? '' : 's'} for "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Recently Viewed */}
        {!loading && !searchQuery.trim() && recentlyViewed.length > 0 && (() => {
          const recentlessons = recentlyViewed
            .map(id => lessons.find(c => c.id === id))
            .filter(Boolean) as Course[];
          if (recentlessons.length === 0) return null;
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
                {recentlessons.slice(0, 8).map((course) => (
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
                        <p className="font-semibold text-sm truncate group-hover:text-purple-600 transition-colors">{course.lessonTitle || course.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {course.lessonTitle ? `${course.subject} · ` : ''}{course.grade === "Common Entrance" ? "CE" : `Gr. ${course.grade}`} &bull; {course.term}
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

        {/* Trending Now Section - Now below main lessons */}
        {!loading && !showOnlyPurchased && getTrendinglessons().length > 0 && (
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
                <p className="text-sm text-muted-foreground">Most popular lessons this week</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTrendinglessons().map((course, index) => (
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
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{course.lessonTitle || course.subject}</h3>
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
                              handleViewCourse(course);
                            } else if (!isInCart(course.subject, course.grade, course.term, course.lessonId)) {
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
                          ) : isInCart(course.subject, course.grade, course.term, course.lessonId) ? (
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

        {/* Recommended for You Section */}
        {(() => {
          if (loading || recommendations.length === 0) return null;

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

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 sm:mt-12 mb-12"
            >
              {/* Section Header */}
              <div className="relative mb-5 sm:mb-8">
                <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-pink-950/30 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl blur opacity-50"></div>
                          <div className="relative p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                            Recommended for You
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            Personalised based on your searches &amp; activity
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {[...new Set(recommendations.map(r => r.reasonType))].slice(0, 3).map(type => {
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
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-3 py-1 text-xs sm:text-sm">
                          {recommendations.length} Picks
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cards — same mobile horizontal / desktop vertical split as main grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {paginatedRecommendations.map((rec, index) => {
                  const course: Course = rec.course;
                  const { reason, reasonType } = rec;
                  const style = reasonStyles[reasonType] ?? reasonStyles['popular'];
                  const Icon = style.icon;
                  const wishlisted = isInWishlist(course.subject, course.grade, course.term);
                  const inCart = isInCart(course.subject, course.grade, course.term, course.lessonId);
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07, duration: 0.35 }}
                    >
                      {/* ── MOBILE: horizontal compact card (matches main grid) ── */}
                      <div
                        className="sm:hidden group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md flex items-stretch cursor-pointer active:scale-[0.985] transition-all duration-150"
                        onClick={() => handleViewCourse(course)}
                      >
                        {/* Thumbnail strip */}
                        <div className={`relative flex-shrink-0 w-[100px] overflow-hidden bg-gradient-to-br ${style.headerBg}`}>
                          {(course.imageUrl || course.thumbnail) && (
                            <img src={course.imageUrl || course.thumbnail} alt={course.subject} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          {!(course.imageUrl || course.thumbnail) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Icon className="w-8 h-8 text-white/80" />
                            </div>
                          )}
                          {/* Reason badge */}
                          <div className="absolute top-2 left-1 right-1">
                            <span className={`block text-center text-[9px] font-bold px-1 py-0.5 rounded-sm uppercase leading-none truncate ${style.reasonBadge}`}>
                              {reason.length > 14 ? reason.slice(0, 14) + '\u2026' : reason}
                            </span>
                          </div>
                          {/* Wishlist */}
                          <button
                            className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleToggleWishlist(course); }}
                          >
                            <Heart className={`w-3 h-3 ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 hover:text-rose-500'}`} />
                          </button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 p-3 flex flex-col gap-1.5">
                          <h4 className="font-bold text-[13px] leading-snug line-clamp-2 text-foreground group-hover:text-purple-600 transition-colors">
                            {course.lessonTitle || course.subject}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {course.grade === 'Common Entrance' ? 'CE' : `Gr. ${course.grade}`} · {course.term.replace(' Term', '')}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {course.rating > 0 && (
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{course.rating.toFixed(1)}</span>
                              </div>
                            )}
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                              <Clock className="w-2.5 h-2.5" />
                              {course.durationDisplay || '30m'}
                            </span>
                          </div>
                          <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(course.price)}</span>
                            <button
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm ${
                                inCart ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300' : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(course); }}
                            >
                              {inCart ? '\u2713 Added' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── DESKTOP: rich vertical card ── */}
                      <Card
                        className={`hidden sm:flex flex-col h-full hover:shadow-2xl transition-all duration-300 border-2 border-transparent group overflow-hidden bg-white dark:bg-gray-900`}
                        onClick={() => handleViewCourse(course)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Coloured header with thumbnail */}
                        <div className={`relative h-32 bg-gradient-to-br ${style.headerBg} overflow-hidden`}>
                          {(course.imageUrl || course.thumbnail) ? (
                            <>
                              <img src={course.imageUrl || course.thumbnail} alt={course.subject} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              <div className="absolute inset-0 bg-black/20" />
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                                <Icon className="w-7 h-7 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5">
                            <Badge className={`${style.reasonBadge} border-0 shadow text-xs font-semibold flex items-center gap-1 px-2 py-0.5`}>
                              <Icon className="w-3 h-3" />{reason}
                            </Badge>
                          </div>
                          <button
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
                            onClick={e => { e.stopPropagation(); handleToggleWishlist(course); }}
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 hover:text-rose-500'}`} />
                          </button>
                        </div>
                        <CardContent className="p-4 flex flex-col gap-3 flex-1">
                          <div>
                            <h3 className={`font-bold text-sm mb-0.5 line-clamp-2 transition-colors ${style.accentText}`}>
                              {course.lessonTitle || course.subject}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {course.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${course.grade}`} · {course.term}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded-lg">
                              <BookOpen className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{course.lessonCount} lessons</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded-lg">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{course.studentCount}+</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t mt-auto">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.floor(course.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                              ))}
                              <span className="text-xs font-semibold ml-1 text-muted-foreground">{course.rating.toFixed(1)}</span>
                            </div>
                            <span className={`text-sm font-bold bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}>
                              {formatCurrency(course.price)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handlePreviewCourse(course); }}>
                              <Eye className="w-3 h-3 mr-1" />Preview
                            </Button>
                            <Button size="sm" className={`flex-1 text-xs text-white bg-gradient-to-r ${style.gradient} hover:opacity-90`} onClick={(e) => { e.stopPropagation(); handleAddToCart(course); }} disabled={inCart}>
                              {inCart ? <><CheckCircle className="w-3 h-3 mr-1" />In Cart</> : <><ShoppingCart className="w-3 h-3 mr-1" />Add</>}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {recommendations.length > recommendationItemsPerPage && (
                <div className="flex flex-col items-center gap-3 mt-8 pt-6 border-t border-purple-100 dark:border-purple-900/30">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Showing {Math.min((currentRecommendationPage - 1) * recommendationItemsPerPage + 1, recommendations.length)}–{Math.min(currentRecommendationPage * recommendationItemsPerPage, recommendations.length)} of {recommendations.length} recommendations
                  </p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {totalRecommendationPages > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex w-9 h-9 p-0"
                        onClick={() => { setCurrentRecommendationPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentRecommendationPage === 1}
                        aria-label="First recommendations page"
                      >
                        «
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-9 px-2.5 sm:px-3"
                      onClick={() => { setCurrentRecommendationPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentRecommendationPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="sr-only sm:not-sr-only">Prev</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: number[] = [];
                        if (totalRecommendationPages <= 5) {
                          for (let i = 1; i <= totalRecommendationPages; i++) pages.push(i);
                        } else if (currentRecommendationPage <= 3) {
                          pages.push(1, 2, 3, -1, totalRecommendationPages);
                        } else if (currentRecommendationPage >= totalRecommendationPages - 2) {
                          pages.push(1, -1, totalRecommendationPages - 2, totalRecommendationPages - 1, totalRecommendationPages);
                        } else {
                          pages.push(1, -1, currentRecommendationPage - 1, currentRecommendationPage, currentRecommendationPage + 1, -2, totalRecommendationPages);
                        }
                        return pages.map((page, idx) => {
                          if (page < 0) {
                            return (
                              <span key={`rec-e-${idx}`} className="hidden sm:inline-flex w-9 h-9 items-center justify-center text-muted-foreground text-sm">
                                …
                              </span>
                            );
                          }

                          const isCurrent = currentRecommendationPage === page;
                          const showOnMobile = Math.abs(page - currentRecommendationPage) <= 1 || page === 1 || page === totalRecommendationPages;

                          return (
                            <Button
                              key={page}
                              variant={isCurrent ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => { setCurrentRecommendationPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className={`w-9 h-9 p-0 ${isCurrent ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm' : ''} ${!showOnMobile ? 'hidden sm:inline-flex' : ''}`}
                              aria-current={isCurrent ? 'page' : undefined}
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
                      className="gap-1 h-9 px-2.5 sm:px-3"
                      onClick={() => { setCurrentRecommendationPage(p => Math.min(totalRecommendationPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentRecommendationPage >= totalRecommendationPages}
                    >
                      <span className="sr-only sm:not-sr-only">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    {totalRecommendationPages > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex w-9 h-9 p-0"
                        onClick={() => { setCurrentRecommendationPage(totalRecommendationPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentRecommendationPage >= totalRecommendationPages}
                        aria-label="Last recommendations page"
                      >
                        »
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}
      </main>

      <StudentFooter />

      {/* Floating Wishlist Button */}
      <AnimatePresence>
        {lessons.filter(c => isInWishlist(c.subject, c.grade, c.term)).length > 0 && (
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
                  {lessons.filter(c => isInWishlist(c.subject, c.grade, c.term)).length}
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
          const alsoBought = getAlsoBoughtlessons(justAddedCourse);
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

                {/* ── Dark notification header ── */}
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
                            const inCart = isInCart(course.subject, course.grade, course.term, course.lessonId);
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
                                    {course.lessonTitle || course.subject}
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
              price: selectedCourseForPreview.price,
              lessonId: selectedCourseForPreview.id,
              title: selectedCourseForPreview.title,
            });
            toast({
              title: "Added to cart",
              description: `${selectedCourseForPreview.title} has been added to your cart.`
            });
          }
        }}
        isEnrolled={selectedCourseForPreview ? enrollments.some(e =>
          isEnrolledUtil(e, selectedCourseForPreview.subject, selectedCourseForPreview.grade, selectedCourseForPreview.term, selectedCourseForPreview.id)
        ) : false}
        isInCart={selectedCourseForPreview ? isInCart(
          selectedCourseForPreview.subject,
          selectedCourseForPreview.grade,
          selectedCourseForPreview.term,
          selectedCourseForPreview.id
        ) : false}
      />
    </div>
  );
};

export default Browselessons;
