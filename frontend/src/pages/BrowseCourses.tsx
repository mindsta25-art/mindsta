import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { CoursePreviewDialog } from "@/components/CoursePreviewDialog";
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
  Eye
} from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import { getTermsByGrade, getSubjectsByGrade, getLessonsBySubjectAndGrade, getLessonById, type Lesson } from "@/api/lessons";
import { getUserProgress, type UserProgress } from "@/api/progress";
import { getStudentByUserId } from "@/api";
import { getEnrollments, type Enrollment } from "@/api/enrollments";
import { getSystemSettings } from "@/api/settings";
import { formatCurrency } from "@/config/siteConfig";

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
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical'>('popular');
  const [studentGrade, setStudentGrade] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showOnlyPurchased, setShowOnlyPurchased] = useState(false);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState<Lesson | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  const terms = ["Term 1", "Term 2", "Term 3"];
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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSystemSettings();
        setItemsPerPage(settings.advanced.coursesPerPage || 12);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
    fetchStudentInfo();
  }, []);

  // Refetch enrollments when page becomes visible (e.g., after purchase)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        fetchStudentInfo();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    if (enrollments.length >= 0) {
      fetchCourses();
    }
  }, [enrollments]);

  useEffect(() => {
    filterAndSortCourses();
    updateAvailableSubjects();
  }, [searchQuery, selectedGrade, selectedSubject, selectedTerm, sortBy, courses, showOnlyPurchased]);

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

  const fetchStudentInfo = async () => {
    if (!user?.id) return;
    try {
      const [studentData, progress, enrollmentsData] = await Promise.all([
        getStudentByUserId(user.id),
        getUserProgress(user.id),
        getEnrollments()
      ]);
      
      setStudentGrade(studentData.grade);
      if (selectedGrade === 'all') {
        setSelectedGrade(studentData.grade);
      }

      setUserProgress(progress);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const allCourses: Course[] = [];
      const subjectsSet = new Set<string>();

      // Fetch courses for all grades
      for (const grade of grades) {
        try {
          const gradeValue = grade === "Common Entrance" ? "Common Entrance" : grade;
          const terms = await getTermsByGrade(gradeValue);

          for (const term of terms) {
            const subjects = await getSubjectsByGrade(gradeValue, term.name);

            for (const subject of subjects) {
              subjectsSet.add(subject.name);
              
              const lessons = await getLessonsBySubjectAndGrade(
                subject.name,
                gradeValue,
                term.name
              );

              if (lessons.length > 0) {
                // Calculate quiz count - estimate based on lesson count
                const quizCount = Math.floor(lessons.length * 0.7); // ~70% of lessons have quizzes
                
                // Check if enrolled from database enrollments (not just progress)
                const enrolled = enrollments.some(e => 
                  e.subject === subject.name && 
                  e.grade === gradeValue && 
                  e.term === term.name
                );
                
                // Calculate completion based on progress
                const courseProgress = userProgress.filter(p => 
                  lessons.some(l => l.id === p.lessonId)
                );
                const completedCount = courseProgress.filter(p => p.completed).length;
                const completionRate = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
                
                const validDifficulty = subject.difficulty && 
                  ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard', 'Beginner', 'Intermediate', 'Advanced'].includes(subject.difficulty)
                  ? subject.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard' | 'Beginner' | 'Intermediate' | 'Advanced'
                  : 'beginner' as const;
                
                allCourses.push({
                  id: `${grade}-${term.name}-${subject.name}`,
                  subject: subject.name,
                  grade: grade,
                  term: term.name,
                  lessonCount: lessons.length,
                  quizCount,
                  description: `Master ${subject.name} concepts for ${grade === "Common Entrance" ? "Common Entrance" : `Grade ${grade}`} - ${term.name}. Build strong foundations and ace your tests.`,
                  difficulty: validDifficulty,
                  estimatedHours: subject.duration ? Math.ceil(subject.duration / 60) : Math.ceil(lessons.length * 0.5),
                  completionRate,
                  enrolled,
                  price: subject.price || 0,
                  rating: subject.rating || 0,
                  studentCount: subject.enrolledStudents || 0
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching courses for grade ${grade}:`, error);
        }
      }

      setAvailableSubjects(Array.from(subjectsSet).sort());
      setCourses(allCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
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

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
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
  };

  const updateAvailableSubjects = () => {
    // Filter courses by selected grade first, then extract unique subjects
    let coursesToCheck = [...courses];
    
    // If a specific grade is selected, only get subjects for that grade
    if (selectedGrade !== 'all') {
      coursesToCheck = coursesToCheck.filter(course => course.grade === selectedGrade);
    }
    
    // Extract unique subjects from the filtered courses
    const subjectsSet = new Set(coursesToCheck.map(course => course.subject));
    const sortedSubjects = Array.from(subjectsSet).sort();
    
    setAvailableSubjects(sortedSubjects);
    
    // Reset selected subject if it's not available in the new grade
    if (selectedSubject !== 'all' && !sortedSubjects.includes(selectedSubject)) {
      setSelectedSubject('all');
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
            {loading ? 'Loading amazing courses...' : `Choose from ${courses.length}+ expertly crafted courses across all grades and subjects`}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-green-600">{enrollments.length}</p>
                <p className="text-sm text-muted-foreground">My Enrolled Courses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.studentCount, 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
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
            
            {/* Search Bar - Enhanced */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
              <Input
                placeholder="Search for courses, subjects, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-base border-2 border-purple-100 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
                      </SelectItem>
                    ))}
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
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters and Clear - Redesigned */}
            <AnimatePresence>
              {(searchQuery || selectedGrade !== 'all' || selectedSubject !== 'all' || selectedTerm !== 'all') && (
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
                <h2 className="text-2xl font-bold mb-1">
                  {filteredCourses.length === 0 ? 'No Courses Found' : 
                   filteredCourses.length === 1 ? '1 Course Available' : 
                   `${filteredCourses.length} Courses Available`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredCourses.filter(c => c.enrolled).length} enrolled • {filteredCourses.length - filteredCourses.filter(c => c.enrolled).length} available
                  {displayedCourses.length < filteredCourses.length && (
                    <> • Showing {displayedCourses.length} of {filteredCourses.length}</>
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
        ) : filteredCourses.length === 0 ? (
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
                <h3 className="text-2xl font-bold mb-3">No Courses Found</h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  We couldn't find any courses matching your criteria. Try adjusting your filters or search query.
                </p>
                <Button 
                  onClick={clearFilters}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
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
                        <Badge className="bg-green-600 text-white shadow-lg hover:bg-green-700 font-bold text-sm px-3 py-1">
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Purchased
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
                          <p className="font-bold text-foreground">{course.estimatedHours}h</p>
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
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                          onClick={() => handleViewCourse(course)}
                        >
                          <BookOpen className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Go to Course
                        </Button>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              className="flex-1 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
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
      </main>

      <StudentFooter />

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
