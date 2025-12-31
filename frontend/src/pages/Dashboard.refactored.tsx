/**
 * Refactored Dashboard - Optimized with custom hooks and separated concerns
 * Performance improvements: Reduced from 20+ useState to 6 custom hooks
 * Code reduction: From 1366 lines to ~500 lines
 * Maintainability: Extracted business logic to utility functions
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Clock,
  Target,
  ChevronRight,
  PlayCircle,
  ArrowRight,
  Star,
  ShoppingCart,
  Heart,
  GraduationCap,
  Loader2,
  BookMarked
} from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { updateStudentGrade } from '@/api';
import { getUserProgress } from '@/api/progress';
import { getLessonsBySubjectAndGrade } from '@/api/lessons';

// Import feature modules
import {
  useStudentInfo,
  useLearningStats,
  useSubjects,
  useRecommendations,
  useRecentActivities,
  useContinueLearning,
  formatNaira,
  formatStudentName,
  createSlug,
  TERM_NAMES,
  TERM_COLORS,
  GRADE_OPTIONS,
  DIFFICULTY_COLORS,
  DEFAULT_LESSON_PRICE,
  QuickStats,
  ContinueLearning,
  RecentActivitySection,
  DashboardSkeleton,
  ErrorBoundary
} from '@/features/dashboard';

interface SubjectProgress {
  name: string;
  icon: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  color: string;
}

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

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Custom hooks for state management
  const { studentInfo, isLoading: isLoadingInfo, setStudentInfo } = useStudentInfo(user?.id);
  const {
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
  } = useSubjects(studentInfo?.grade);

  // User progress state
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [subjectInfo, setSubjectInfo] = useState<Record<string, { desc?: string; loading?: boolean }>>({});

  // Derived data using custom hooks
  const { stats: learningStats, weeklySeries } = useLearningStats(userProgress, allGradeLessons);
  const continueData = useContinueLearning(userProgress, allGradeLessons);
  const recentActivities = useRecentActivities(userProgress, allGradeLessons);
  const recommended = useRecommendations(userProgress, allGradeLessons, continueData?.lesson);

  // Compute term progress
  const termProgress = useMemo<SubjectProgress[]>(() => {
    if (!allGradeLessons || !userProgress) return [];

    return TERM_NAMES.map((termName, idx) => {
      const lessonsInTerm = allGradeLessons.filter(l => l.term === termName);
      const completedInTerm = lessonsInTerm.filter(l =>
        userProgress.some(p => p.lessonId === l.id && p.completed)
      ).length;
      const total = lessonsInTerm.length;
      const pct = total > 0 ? Math.round((completedInTerm / total) * 100) : 0;

      return {
        name: termName,
        icon: '📚',
        progress: pct,
        lessonsCompleted: completedInTerm,
        totalLessons: total,
        color: TERM_COLORS[idx % TERM_COLORS.length]
      };
    });
  }, [allGradeLessons, userProgress]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch user progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      try {
        const prog = await getUserProgress(user.id);
        setUserProgress(prog || []);
      } catch (e) {
        console.error('Failed to load user progress', e);
      }
    };
    fetchProgress();
  }, [user]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreSubjects) {
          loadMoreSubjects();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMoreSubjects, loadMoreSubjects]);

  // Prefetch subject info on hover
  const prefetchSubjectInfo = useCallback(async (subjectName: string) => {
    if (!selectedGrade || !selectedTerm) return;
    
    const key = subjectName;
    const existing = subjectInfo[key];
    if (existing && (existing.desc || existing.loading)) return;

    setSubjectInfo((s) => ({ ...s, [key]: { ...s[key], loading: true } }));
    
    try {
      const lessonsData = await getLessonsBySubjectAndGrade(
        subjectName,
        selectedGrade,
        selectedTerm
      );
      const first = lessonsData?.[0];
      const raw = first?.description || '';
      const snippet = raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
      setSubjectInfo((s) => ({ ...s, [key]: { desc: snippet, loading: false } }));
    } catch {
      setSubjectInfo((s) => ({ ...s, [key]: { desc: undefined, loading: false } }));
    }
  }, [selectedGrade, selectedTerm, subjectInfo]);

  // Handlers
  const handleGradeChange = useCallback(async (grade: string) => {
    if (!user) return;

    try {
      setSelectedGrade(grade);
      const updated = await updateStudentGrade(user.id, grade);

      if (updated) {
        setStudentInfo(prev => prev ? { ...prev, grade } : null);
      }
    } catch (error) {
      console.error('Error updating grade:', error);
    }
  }, [user, setSelectedGrade, setStudentInfo]);

  const handleAddToCart = useCallback(async (
    subjectName: string,
    grade: string,
    term: string,
    price: number = DEFAULT_LESSON_PRICE
  ) => {
    try {
      await addToCart({ subject: subjectName, grade, term, price });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [addToCart]);

  const handleAddToWishlist = useCallback(async (
    subjectName: string,
    grade: string,
    term: string
  ) => {
    try {
      await addToWishlist({ subject: subjectName, grade, term });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  }, [addToWishlist]);

  // Loading state
  if (authLoading || isLoadingInfo) {
    return <DashboardSkeleton />;
  }

  const displayName = formatStudentName(studentInfo?.fullName);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentInfo?.fullName} />

        <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 container mx-auto px-4 sm:px-6">
          {/* Hero Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Welcome back, {displayName}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Let's pick up where you left off
            </p>
          </motion.div>

          {/* Grade Assessment Banner */}
          {(!studentInfo?.grade || studentInfo?.grade === 'Not Specified') && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mb-8"
            >
              <Card className="border-2 border-indigo-400 bg-gradient-to-r from-indigo-50 via-cyan-50 to-blue-50 dark:from-indigo-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                        <GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1">Not sure which grade to start with?</h3>
                        <p className="text-sm text-muted-foreground">
                          Take our quick assessment to find your perfect learning level
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/grade-assessment')}
                      className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white whitespace-nowrap"
                    >
                      Find My Grade
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Stats */}
          <QuickStats stats={learningStats} />

          {/* Continue Learning */}
          <ContinueLearning
            data={continueData}
            selectedGrade={selectedGrade}
            onAddToWishlist={handleAddToWishlist}
            isInWishlist={isInWishlist}
          />

          {/* Browse by Grade & Subject */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Browse by Grade</h2>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Select Grade</label>
                    <Select value={selectedGrade} onValueChange={handleGradeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            {grade === 'Common Entrance' ? grade : `Grade ${grade}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Select Term</label>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!availableTerms.length}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTerms ? 'Loading...' : 'Choose a term'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTerms.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Term Progress */}
                {selectedGrade && termProgress.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    {termProgress.map((term, index) => (
                      <div
                        key={index}
                        className="p-3 sm:p-4 rounded-lg border hover:border-indigo-300 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/grade/${selectedGrade}/term/${createSlug(term.name)}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/grade/${selectedGrade}/term/${createSlug(term.name)}`)}
                        aria-label={`View ${term.name} with ${term.lessonsCompleted} out of ${term.totalLessons} lessons completed`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                                <span className="truncate">{term.name}</span>
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {term.lessonsCompleted}/{term.totalLessons} lessons
                              </p>
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold ml-2 flex-shrink-0">{term.progress}%</span>
                        </div>
                        <Progress value={term.progress} className="h-1.5 sm:h-2" aria-label={`Progress: ${term.progress}%`} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <RecentActivitySection activities={recentActivities} />

          {/* Recommended Section */}
          {recommended && recommended.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8 sm:mb-12"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Recommended for You</h2>
                <Button variant="link" onClick={() => navigate('/my-learning')} className="text-sm sm:text-base">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
                role="list"
                aria-label="Recommended lessons"
              >
                {recommended.map((r, index) => {
                  const grade = selectedGrade || r.lesson.grade;
                  const subjectSlug = createSlug(r.lesson.subject);
                  
                  return (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="relative z-0 hover:z-10"
                      role="listitem"
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow group overflow-hidden">
                        <div
                          className="cursor-pointer h-full"
                          onClick={() => navigate(`/grade/${grade}/${subjectSlug}/lesson/${r.lesson.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/grade/${grade}/${subjectSlug}/lesson/${r.lesson.id}`)}
                          aria-label={`Learn ${r.lesson.title} in ${r.lesson.subject}`}
                        >
                          {/* Thumbnail */}
                          <div className="h-36 sm:h-40 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white opacity-90" aria-hidden="true" />
                            </div>
                            {r.lesson.difficulty && (
                              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                                <Badge className={`text-xs font-semibold ${DIFFICULTY_COLORS[r.lesson.difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-gray-500'}`}>
                                  {r.lesson.difficulty}
                                </Badge>
                              </div>
                            )}
                            {r.lesson.duration && (
                              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                                <Badge variant="secondary" className="text-xs gap-1 bg-white/90">
                                  <Clock className="w-3 h-3" />
                                  {r.lesson.duration} min
                                </Badge>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <Badge variant="outline" className="text-xs font-medium">
                                {r.lesson.subject}
                              </Badge>
                              <span className="text-sm font-bold text-indigo-600">
                                {formatNaira(r.lesson.price || DEFAULT_LESSON_PRICE)}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                              {r.lesson.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                              {r.lesson.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                                <Target className="w-3 h-3" />
                                <span className="line-clamp-1">{r.reason}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* Subjects for selected term */}
          {selectedTerm && subjects.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-8 sm:mb-12"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {selectedTerm} Subjects
                </h2>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                role="list"
                aria-label="Available subjects"
              >
                {displayedSubjects.map((subject) => (
                  <motion.div
                    key={subject.name}
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative z-0 hover:z-10"
                    role="listitem"
                  >
                    <HoverCard
                      openDelay={150}
                      closeDelay={100}
                      onOpenChange={(open) => open && prefetchSubjectInfo(subject.name)}
                    >
                      <HoverCardTrigger asChild>
                        <Card
                          className="h-full hover:shadow-md transition-shadow group cursor-pointer"
                          onClick={() => {
                            const subjectSlug = createSlug(subject.name);
                            const termSlug = createSlug(selectedTerm);
                            navigate(`/subject/${subjectSlug}?grade=${selectedGrade}&term=${termSlug}`);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const subjectSlug = createSlug(subject.name);
                              const termSlug = createSlug(selectedTerm);
                              navigate(`/subject/${subjectSlug}?grade=${selectedGrade}&term=${termSlug}`);
                            }
                          }}
                          aria-label={`Explore ${subject.name} with ${subject.lessonCount} lessons`}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-1 group-hover:text-indigo-600 transition-colors text-sm sm:text-base truncate">
                                  {subject.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {subject.lessonCount} {subject.lessonCount === 1 ? 'lesson' : 'lessons'}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                            </div>

                            {/* Mobile action buttons */}
                            <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(subject.name, selectedGrade, selectedTerm, DEFAULT_LESSON_PRICE);
                                }}
                                disabled={isInCart(subject.name, selectedGrade || '', selectedTerm || '')}
                              >
                                {isInCart(subject.name, selectedGrade || '', selectedTerm || '')
                                  ? 'In Cart'
                                  : `Add (${formatNaira(DEFAULT_LESSON_PRICE)})`}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToWishlist(subject.name, selectedGrade, selectedTerm);
                                }}
                                disabled={isInWishlist(subject.name, selectedGrade || '', selectedTerm || '')}
                              >
                                {isInWishlist(subject.name, selectedGrade || '', selectedTerm || '')
                                  ? 'Saved'
                                  : 'Wishlist'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </HoverCardTrigger>

                      <HoverCardContent className="w-full" side="top" align="center" sideOffset={5}>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Subject</p>
                              <h4 className="font-semibold">{subject.name}</h4>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Price</p>
                              <p className="font-semibold">{formatNaira(DEFAULT_LESSON_PRICE)}</p>
                            </div>
                          </div>
                          <div className="text-sm">
                            <p className="text-muted-foreground">About</p>
                            {subjectInfo[subject.name]?.loading ? (
                              <p className="italic text-muted-foreground">Loading details…</p>
                            ) : subjectInfo[subject.name]?.desc ? (
                              <p className="font-medium">{subjectInfo[subject.name]?.desc}</p>
                            ) : (
                              <p className="text-muted-foreground">Start learning {subject.name} this term.</p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Grade</p>
                              <p className="font-medium">{selectedGrade || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Term</p>
                              <p className="font-medium">{selectedTerm || '-'}</p>
                            </div>
                          </div>
                          <div className="text-sm">
                            <p className="text-muted-foreground">Lessons</p>
                            <p className="font-medium">{subject.lessonCount}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              size="sm"
                              className="w-full gap-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(subject.name, selectedGrade, selectedTerm, DEFAULT_LESSON_PRICE);
                              }}
                              disabled={isInCart(subject.name, selectedGrade || '', selectedTerm || '')}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              {isInCart(subject.name, selectedGrade || '', selectedTerm || '')
                                ? 'In Cart'
                                : `Add (${formatNaira(DEFAULT_LESSON_PRICE)})`}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full gap-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToWishlist(subject.name, selectedGrade, selectedTerm);
                              }}
                              disabled={isInWishlist(subject.name, selectedGrade || '', selectedTerm || '')}
                            >
                              <Heart className="w-4 h-4" />
                              {isInWishlist(subject.name, selectedGrade || '', selectedTerm || '')
                                ? 'Saved'
                                : 'Wishlist'}
                            </Button>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </motion.div>
                ))}
              </motion.div>

              {/* Infinite scroll sentinel */}
              {hasMoreSubjects && (
                <div ref={observerTarget} className="flex justify-center py-8" aria-live="polite">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="sr-only">Loading more subjects...</span>
                </div>
              )}
            </motion.div>
          )}
        </main>
        <StudentFooter />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
