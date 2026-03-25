import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { CompleteProfileModal } from '@/components/CompleteProfileModal';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { OnboardingTour } from '@/components/OnboardingTour';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { SuggestionBox } from '@/components/SuggestionBox';
import { WeeklyGoalWidget } from '@/components/gamification/WeeklyGoalWidget';
import { StreakProtectionWidget } from '@/components/gamification/StreakProtectionWidget';
import { PerformanceAnalyticsWidget } from '@/components/gamification/PerformanceAnalyticsWidget';
import { AchievementsWidget } from '@/components/gamification/AchievementsWidget';
import { StudyTimeHeatmap } from '@/components/gamification/StudyTimeHeatmap';
import { MilestonesWidget } from '@/components/gamification/MilestonesWidget';
import { SubjectMasteryWidget } from '@/components/gamification/SubjectMasteryWidget';
import { DailyQuoteWidget } from '@/components/gamification/DailyQuoteWidget';
import { LeaderboardWidget } from '@/components/gamification/LeaderboardWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  Target,
  GraduationCap,
  BookMarked,
  Sparkles,
  ChevronRight,
  PlayCircle,
  Star,
  Flame,
  Trophy,
  BarChart3,
  CheckCircle,
  Lightbulb,
  Brain
} from 'lucide-react';
import { isEnrolled as isEnrolledUtil } from '@/utils/enrollmentUtils';
import { getStudentByUserId, updateStreak } from '@/api/students';
import { getUserProgress, type UserProgress } from '@/api/progress';
import { getEnrollments, type Enrollment } from '@/api/enrollments';
import { getLessons, type Lesson } from '@/api/lessons';
import { 
  getGamificationStats, 
  updateWeeklyGoal, 
  useStreakFreeze, 
  getAnalytics, 
  getAchievements,  getMilestones,
  getMastery,
  getLeaderboard,
  updateLeaderboardSettings,
  getQuoteOfDay,
  type GamificationStats,
  type AnalyticsData,
  type Achievement
} from '@/api/gamification';
import { siteConfig, getWhatsAppUrl } from '@/config/siteConfig';

const MotionLink = motion(Link);

interface StudentInfo {
  id: string;
  fullName: string;
  grade: string;
  schoolName: string;
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string | null;
}

interface EnrolledLesson extends Lesson {
  isEnrolled: boolean;
}

const StudentHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [enrolledLessons, setEnrolledLessons] = useState<EnrolledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAccessedLesson, setLastAccessedLesson] = useState<Lesson | null>(null);
  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState(0);
  
  // Gamification state
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weekProgress, setWeekProgress] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [milestones, setMilestones] = useState<any>(null);
  const [mastery, setMastery] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>({ leaderboard: [], userPosition: undefined, totalParticipants: 0 });
  const [quoteOfDay, setQuoteOfDay] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);
        
        const [studentData, progressData, enrollmentsData, lessonsData] = await Promise.all([
          getStudentByUserId(user.id),
          getUserProgress(user.id),
          getEnrollments(),
          getLessons(),
        ]);

        if (!studentData) {
          // Google OAuth users have no Student record yet — show profile setup modal
          if (localStorage.getItem('needsProfileSetup') === 'true') {
            setLoading(false);
            setShowProfileModal(true);
            return;
          }
          throw new Error('Failed to load student information. Please check your connection and try again.');
        }

        setStudentInfo(studentData);
        setProgress(progressData || []);
        setEnrollments(enrollmentsData || []);
        setAllLessons(lessonsData || []);

        // Update streak when user visits dashboard
        updateStreak(user.id).then(streakData => {
          if (streakData) {
            setStudentInfo(prev => prev ? {
              ...prev,
              currentStreak: streakData.currentStreak,
              longestStreak: streakData.longestStreak
            } : null);
          }
        });

        // Filter lessons to only show enrolled ones.
        // Per-lesson enrollments (enrollment.lessonId set) only grant access to the exact lesson;
        // subject-level enrollments grant access to all lessons in the subject.
        const enrolled = lessonsData.filter(lesson =>
          enrollmentsData.some(enrollment => {
            if (enrollment.lessonId) {
              return isEnrolledUtil(enrollment, lesson.subject, lesson.grade, lesson.term, lesson.id);
            }
            return isEnrolledUtil(enrollment, lesson.subject, lesson.grade, lesson.term);
          })
        ).map(lesson => ({
          ...lesson,
          isEnrolled: true
        }));

        setEnrolledLessons(enrolled);
        
        // Find last accessed lesson from progress
        if (progressData && progressData.length > 0) {
          const sortedProgress = progressData
            .filter(p => !p.completed)
            .sort((a, b) => new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime());
          
          if (sortedProgress.length > 0) {
            const lastProgressLesson = enrolled.find(l => l.id === sortedProgress[0].lessonId);
            if (lastProgressLesson) {
              setLastAccessedLesson(lastProgressLesson);
            }
          }
        }
        
        // Calculate weekly study time (estimated from completed lessons this week)
        if (progressData) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const recentCompletions = progressData.filter(p => 
            p.completed && new Date(p.completedAt || 0) > oneWeekAgo
          );
          
          // Estimate 15 minutes per completed lesson
          setWeeklyStudyMinutes(recentCompletions.length * 15);
        }

        // Fetch gamification data
        try {
          const [gamStats, analytics, achievementData, milestonesData, masteryData, leaderboardData, quoteData] = await Promise.all([
            getGamificationStats(),
            getAnalytics(),
            getAchievements(),
            getMilestones(),
            getMastery(),
            getLeaderboard('allTime', 'global'),
            getQuoteOfDay(),
          ]);

          setGamificationStats(gamStats);
          setAnalyticsData(analytics);
          setAchievements(achievementData?.achievements || []);
          setMilestones(milestonesData);
          setMastery(masteryData.mastery || []);
          setLeaderboard(leaderboardData);
          setQuoteOfDay(quoteData);

          // Calculate week progress for goals
          const today = new Date().getDay(); // 0 = Sunday
          const weekProgressArray = new Array(7).fill(false);
          for (let i = 0; i < 7; i++) {
            const dayDate = new Date();
            dayDate.setDate(dayDate.getDate() - (6 - i));
            dayDate.setHours(0, 0, 0, 0);
            
            const completedOnDay = progressData.filter(p => {
              if (!p.completedAt) return false;
              const compDate = new Date(p.completedAt);
              compDate.setHours(0, 0, 0, 0);
              return compDate.getTime() === dayDate.getTime();
            }).length;
            
            weekProgressArray[i] = completedOnDay >= (gamStats.weeklyGoal?.dailyLessons || 3);
          }
          setWeekProgress(weekProgressArray);

          // Show toast for new achievements
          if (gamStats.newAchievements && gamStats.newAchievements.length > 0) {
            gamStats.newAchievements.forEach((ach) => {
              const achievement = achievementData?.achievements?.find(a => a.id === ach.achievementId);
              if (achievement) {
                toast({
                  title: "🎉 Achievement Unlocked!",
                  description: `${achievement.name} - +${achievement.coinReward} coins`,
                });
              }
            });
          }
        } catch (gamError) {
          console.error('Error fetching gamification data:', gamError);
          // Non-critical error, don't block the page
        }
      } catch (error: any) {
        console.error('Error fetching student data:', error);
        setError(
          error?.message || 
          'Unable to load student information. Please check your internet connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, fetchTrigger]);

  const handleRetry = () => {
    setError(null);
    setFetchTrigger(prev => prev + 1);
  };

  const completedCount = progress.filter(p => p.completed).length;
  // Count unique enrolled subjects/topics (not individual lessons)
  const uniqueEnrolledSubjects = new Set(
    enrollments.map(e => `${e.subject}-${e.grade}-${e.term}`)
  ).size;
  const totalEnrollments = uniqueEnrolledSubjects;
  const completionRate = enrolledLessons.length > 0 
    ? Math.round((completedCount / enrolledLessons.length) * 100) 
    : 0;

  // Group enrolled lessons into course-level entries (collective view, not individual lessons)
  const recentCourses = (() => {
    const courseMap = new Map<string, {
      subject: string;
      grade: string;
      term?: string;
      lessonId?: string;
      enrollmentDate?: Date;
      lessonsTotal: number;
      lessonsCompleted: number;
      progress: number;
      nextLesson?: EnrolledLesson;
      thumbnailUrl?: string;
      lastAccessed?: Date;
    }>();

    for (const lesson of enrolledLessons) {
      // Use per-lesson key so each purchased lesson gets its own card
      const perLessonEnrollment = enrollments.find(e =>
        e.lessonId && isEnrolledUtil(e, lesson.subject, lesson.grade, lesson.term, lesson.id)
      );
      const key = perLessonEnrollment
        ? `${lesson.subject}-${lesson.grade}-${lesson.term || 'general'}-${lesson.id}`
        : `${lesson.subject}-${lesson.grade}-${lesson.term || 'general'}`;
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          subject: lesson.subject,
          grade: lesson.grade,
          term: lesson.term,
          lessonId: perLessonEnrollment ? lesson.id : undefined,
          enrollmentDate: perLessonEnrollment
            ? new Date(perLessonEnrollment.purchasedAt || perLessonEnrollment.createdAt)
            : undefined,
          lessonsTotal: 0,
          lessonsCompleted: 0,
          progress: 0,
        });
      }
      const course = courseMap.get(key)!;
      course.lessonsTotal += 1;

      if (!course.thumbnailUrl && lesson.imageUrl) {
        course.thumbnailUrl = lesson.imageUrl;
      }

      const lessonProg = progress.find(p => p.lessonId === lesson.id);
      if (lessonProg) {
        if (lessonProg.completed) {
          course.lessonsCompleted += 1;
        } else if (!course.nextLesson) {
          course.nextLesson = lesson;
        }
        const accessedDate = new Date(lessonProg.lastAccessedAt);
        if (!course.lastAccessed || accessedDate > course.lastAccessed) {
          course.lastAccessed = accessedDate;
        }
      } else if (!course.nextLesson) {
        course.nextLesson = lesson;
      }
    }

    courseMap.forEach((course) => {
      course.progress = course.lessonsTotal > 0
        ? Math.round((course.lessonsCompleted / course.lessonsTotal) * 100)
        : 0;
    });

    return Array.from(courseMap.values())
      .sort((a, b) => {
        // Sort by most recent engagement: use lastAccessed if available, otherwise
        // fall back to enrollmentDate so newly purchased (not-yet-started) lessons
        // appear near the top instead of being buried under older accessed courses.
        const aDate = a.lastAccessed ?? a.enrollmentDate;
        const bDate = b.lastAccessed ?? b.enrollmentDate;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 4);
  })();

  const quickActions = [
    ...(lastAccessedLesson ? [{
      icon: PlayCircle,
      title: 'Resume Learning',
      description: `Continue: ${lastAccessedLesson.title}`,
      gradient: 'from-green-500 to-emerald-500',
      action: () => {
        const p = new URLSearchParams();
        if (lastAccessedLesson.term) p.set('term', lastAccessedLesson.term);
        p.set('lessonId', lastAccessedLesson.id);
        navigate(`/subjects/${lastAccessedLesson.grade}/${lastAccessedLesson.subject}?${p.toString()}`);
      },
    }] : []),
    {
      icon: BookOpen,
      title: 'Browse Courses',
      description: 'Explore all available lessons',
      gradient: 'from-blue-500 to-cyan-500',
      action: () => navigate('/browse'),
    },
    {
      icon: GraduationCap,
      title: 'My Learning',
      description: 'Continue your enrolled courses',
      gradient: 'from-purple-500 to-pink-500',
      action: () => navigate('/my-learning'),
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      description: 'See how you rank among peers',
      gradient: 'from-yellow-500 to-orange-500',
      action: () => navigate('/leaderboard'),
    },
    {
      icon: TrendingUp,
      title: 'Progress Milestones',
      description: 'Track your learning milestones',
      gradient: 'from-teal-500 to-cyan-500',
      action: () => navigate('/progress'),
    },
    {
      icon: Award,
      title: 'Achievements',
      description: 'View your earned badges & awards',
      gradient: 'from-indigo-500 to-violet-500',
      action: () => navigate('/achievements'),
    },
    {
      icon: Brain,
      title: 'Quick Quiz',
      description: 'Test your knowledge fast',
      gradient: 'from-rose-500 to-orange-500',
      action: () => navigate('/quick-quiz'),
    },
  ];

  const stats = [
    {
      icon: Flame,
      label: 'Day Streak',
      value: `${studentInfo?.currentStreak || 0}`,
      gradient: 'from-orange-500 to-red-500',
      subtext: `Best: ${studentInfo?.longestStreak || 0} days`,
    },
    {
      icon: BookMarked,
      label: 'Enrolled Subjects',
      value: totalEnrollments.toString(),
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Award,
      label: 'Completed',
      value: completedCount.toString(),
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Clock,
      label: 'Study Time (Week)',
      value: `${Math.floor(weeklyStudyMinutes / 60)}h ${weeklyStudyMinutes % 60}m`,
      gradient: 'from-purple-500 to-pink-500',
      subtext: `${weeklyStudyMinutes} min total`,
    },
  ];

  // Gamification handlers
  const handleUpdateWeeklyGoal = async (dailyLessons: number, enabled: boolean) => {
    try {
      await updateWeeklyGoal(dailyLessons, enabled);
      setGamificationStats(prev => prev ? {
        ...prev,
        weeklyGoal: { dailyLessons, enabled }
      } : null);
      toast({
        title: "Goal Updated",
        description: `Your daily goal is now ${dailyLessons} lessons`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUseStreakFreeze = async () => {
    try {
      await useStreakFreeze();
      setGamificationStats(prev => prev ? {
        ...prev,
        streakFreezes: {
          ...prev.streakFreezes,
          available: prev.streakFreezes.available - 1,
        }
      } : null);
      toast({
        title: "Streak Protected! 🛡️",
        description: "Your streak is safe for today",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to use freeze",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <StudentHeader studentName={studentInfo?.fullName} />
        <main className="pt-2 sm:pt-6 pb-12 sm:pb-16">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Hero skeleton */}
            <Skeleton className="h-36 sm:h-44 w-full rounded-2xl mb-6 sm:mb-8" />
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
              ))}
            </div>
            {/* Content skeleton */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <StudentHeader studentName={studentInfo?.fullName} />
        <div className="pt-2 flex items-center justify-center min-h-screen">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to Load Student Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetry} className="bg-indigo-600 hover:bg-indigo-700">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/browse')}
                >
                  Browse lessonss
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <StudentHeader studentName={studentInfo?.fullName} />
      <OnboardingTour />
      {/* Profile setup modal — only shown to Google OAuth users on first login */}
      <CompleteProfileModal
        open={showProfileModal}
        onComplete={() => {
          setShowProfileModal(false);
          // Re-fetch now that the student record exists
          window.location.reload();
        }}
      />
      <WhatsAppButton />
      
      <main className="pt-2 sm:pt-6 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 sm:mb-8"
          >
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
              </div>
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80">{studentInfo?.schoolName} · Grade {studentInfo?.grade}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                    Welcome back, {studentInfo?.fullName?.split(' ')[0] || 'Student'}! 👋
                  </h1>
                  <p className="text-sm sm:text-base text-white/75 max-w-md">
                    {lastAccessedLesson
                      ? `Pick up where you left off in ${lastAccessedLesson.title}`
                      : 'Start your learning journey — explore subjects and track your progress!'}
                  </p>
                </div>
                {lastAccessedLesson ? (
                  <button
                    onClick={() => {
                      const p = new URLSearchParams();
                      if (lastAccessedLesson.term) p.set('term', lastAccessedLesson.term);
                      p.set('lessonId', lastAccessedLesson.id);
                      navigate(`/subjects/${lastAccessedLesson.grade}/${lastAccessedLesson.subject}?${p.toString()}`);
                    }}
                    className="flex-shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm border border-white/20"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Continue Learning
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/browse')}
                    className="flex-shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm border border-white/20"
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse Courses
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-3 shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
                {stat.subtext && (
                  <div className="text-xs text-muted-foreground mt-0.5 opacity-75">
                    {stat.subtext}
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Daily Quote Widget */}
          {quoteOfDay && gamificationStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <DailyQuoteWidget
                quote={quoteOfDay.quote}
                author={quoteOfDay.author}
                personalMessage={quoteOfDay.personalMessage}
                completedToday={gamificationStats.stats.lessonsCompletedToday}
              />
            </motion.div>
          )}

          {/* Subject Performance Overview */}
          {enrolledLessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-6 sm:mb-8"
            >
              <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-indigo-100 dark:border-indigo-900/30">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Your Subject Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {Array.from(new Set(enrolledLessons.map(l => l.subject))).slice(0, 8).map((subject, idx) => {
                      const subjectLessons = enrolledLessons.filter(l => l.subject === subject);
                      const subjectProgress = progress.filter(p => 
                        subjectLessons.some(l => l.id === p.lessonId)
                      );
                      const completedInSubject = subjectProgress.filter(p => p.completed).length;
                      const percentage = subjectLessons.length > 0 
                        ? Math.round((completedInSubject / subjectLessons.length) * 100) 
                        : 0;
                      
                      return (
                        <motion.div
                          key={subject}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * idx }}
                          className="relative"
                        >
                          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => {
                            const lesson = subjectLessons[0];
                            navigate(`/subjects/${lesson.grade}/${lesson.subject}${lesson.term ? `?term=${lesson.term}` : ''}`);
                          }}>
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex flex-col items-center text-center">
                                <div className="relative mb-2">
                                  <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80">
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="30"
                                      stroke="currentColor"
                                      strokeWidth="6"
                                      fill="none"
                                      className="text-gray-200 dark:text-gray-700"
                                    />
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="30"
                                      stroke="currentColor"
                                      strokeWidth="6"
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 30}`}
                                      strokeDashoffset={`${2 * Math.PI * 30 * (1 - percentage / 100)}`}
                                      className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000"
                                      strokeLinecap="round"
                                      transform="rotate(-90 40 40)"
                                    />
                                    <text
                                      x="40"
                                      y="40"
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      className="fill-current text-foreground"
                                      fontSize="14"
                                      fontWeight="700"
                                    >
                                      {percentage}%
                                    </text>
                                  </svg>
                                </div>
                                <h4 className="text-xs sm:text-sm font-semibold mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {subject}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {completedInSubject}/{subjectLessons.length} complete
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Analytics Section - Full Width */}
          {analyticsData && (
            <div className="grid lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <PerformanceAnalyticsWidget
                  weeklyActivity={analyticsData.weeklyActivity}
                  subjectPerformance={analyticsData.subjectPerformance}
                  avgMinutesPerDay={analyticsData.avgMinutesPerDay}
                  totalStudyMinutes={analyticsData.totalStudyMinutes}
                  strongest={analyticsData.strongest}
                  weakest={analyticsData.weakest}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <StudyTimeHeatmap
                  studyData={analyticsData.weeklyActivity.map(d => ({
                    date: d.date,
                    minutes: d.minutes,
                  }))}
                />
              </motion.div>
            </div>
          )}

          {/* Subject Mastery Section */}
          {mastery && mastery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6 sm:mb-8"
            >
              <SubjectMasteryWidget mastery={mastery} />
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="text-left p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
                      >
                        <div className={`w-9 h-9 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm mb-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                          {action.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Continue Learning */}
              {recentCourses.length > 0 ? (
                <Card className="mt-4 sm:mt-5 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        Continue Learning
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/my-learning')}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 h-7 px-2.5"
                      >
                        View All
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2.5">
                      {recentCourses.map((course, idx) => {
                        const continueLessonId = course.nextLesson?.id ?? course.lessonId;
                        const continueParams = new URLSearchParams();
                        if (course.term) continueParams.set('term', course.term);
                        if (continueLessonId) continueParams.set('lessonId', continueLessonId);
                        const continueHref = `/subjects/${course.grade}/${course.subject}${continueParams.toString() ? `?${continueParams.toString()}` : ''}`;

                        return (
                        <motion.div
                          key={`${course.subject}-${course.grade}-${course.term}-${continueLessonId ?? idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.06 }}
                        >
                        <Link
                          to={continueHref}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50/40 dark:hover:bg-cyan-900/10 transition-all group block"
                        >
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.subject}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                              {course.nextLesson?.title || course.subject}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-1.5">
                              Grade {course.grade}{course.term ? ` · ${course.term}` : ''}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${Math.max(course.progress, 2)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0 w-10 text-right">
                                {course.progress === 100 ? (
                                  <span className="text-green-600 dark:text-green-400 font-medium">Done</span>
                                ) : `${course.progress}%`}
                              </span>
                            </div>
                          </div>
                          <PlayCircle className="w-4 h-4 text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                        </Link>
                        </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mt-4 sm:mt-5 shadow-sm">
                  <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">No courses yet</h4>
                      <p className="text-xs text-muted-foreground max-w-xs">Browse our course catalog to find subjects that match your grade and start learning today.</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/browse')} className="mt-1">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Browse lessonss
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Sidebar - Gamification Widgets */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="space-y-4"
            >
              {/* Weekly Goal Widget */}
              {gamificationStats && (
                <WeeklyGoalWidget
                  dailyGoal={gamificationStats.weeklyGoal.dailyLessons}
                  enabled={gamificationStats.weeklyGoal.enabled}
                  completedToday={gamificationStats.stats.lessonsCompletedToday}
                  weekProgress={weekProgress}
                  onUpdateGoal={handleUpdateWeeklyGoal}
                />
              )}

              {/* Streak Protection Widget */}
              {gamificationStats && studentInfo && (
                <StreakProtectionWidget
                  currentStreak={studentInfo.currentStreak || 0}
                  bestStreak={studentInfo.longestStreak || 0}
                  freezesAvailable={gamificationStats.streakFreezes.available}
                  onUseFreeze={handleUseStreakFreeze}
                />
              )}

              {/* Personalized Recommendations */}
              {analyticsData && analyticsData.weakest && analyticsData.weakest.percentage < 70 && (
                <Card className="shadow-sm border border-blue-100 dark:border-blue-900/30">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Recommended for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30">
                      <h4 className="font-semibold text-sm mb-0.5">
                        Focus on {analyticsData.weakest.subject}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {analyticsData.weakest.percentage}% complete — keep going!
                      </p>
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => {
                          const lesson = enrolledLessons.find(l => l.subject === analyticsData.weakest?.subject);
                          if (lesson) {
                            const perLesson = enrollments.some(e => e.lessonId === lesson.id);
                            const p = new URLSearchParams();
                            if (lesson.term) p.set('term', lesson.term);
                            if (perLesson) p.set('lessonId', lesson.id);
                            navigate(`/subjects/${lesson.grade}/${lesson.subject}${p.toString() ? `?${p}` : ''}`);
                          }
                        }}
                      >
                        Continue Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestion Box */}
              <SuggestionBox 
                variant="card" 
                defaultGrade={studentInfo?.grade}
              />

            </motion.div>
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
};

export default StudentHome;
