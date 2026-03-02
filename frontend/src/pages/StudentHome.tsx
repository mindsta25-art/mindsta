import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
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

        // Filter lessons to only show enrolled ones
        const enrolled = lessonsData.filter(lesson => 
          enrollmentsData.some(enrollment => 
            enrollment.subject === lesson.subject &&
            enrollment.grade === lesson.grade &&
            enrollment.term === lesson.term
          )
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
  }, [user?.id]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger re-fetch by updating a dependency or calling fetchData directly
    window.location.reload();
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

  const recentLessons = enrolledLessons.slice(0, 4);

  const quickActions = [
    ...(lastAccessedLesson ? [{
      icon: PlayCircle,
      title: 'Resume Learning',
      description: `Continue: ${lastAccessedLesson.title}`,
      gradient: 'from-green-500 to-emerald-500',
      action: () => navigate(`/subjects/${lastAccessedLesson.grade}/${lastAccessedLesson.subject}${lastAccessedLesson.term ? `?term=${lastAccessedLesson.term}` : ''}`),
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
        <main className="pt-2 pb-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Loading Skeletons */}
            <div className="mb-8">
              <Skeleton className="h-12 w-64 mb-4" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-96" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
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
                  Browse Courses
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
      <WhatsAppButton />
      
      <main className="pt-2 sm:pt-6 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <motion.div 
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden group cursor-pointer border border-white/20"
              whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.5)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Animated background particles */}
              <div className="absolute inset-0 opacity-20">
                <motion.div
                  className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    x: [0, 10, 0],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-10 right-10 w-32 h-32 bg-cyan-300 rounded-full blur-2xl"
                  animate={{
                    y: [0, 20, 0],
                    x: [0, -15, 0],
                  }}
                  transition={{ duration: 7, repeat: Infinity }}
                />
              </div>
              
              <div className="relative z-10">
                <motion.div 
                  className="flex items-center gap-3 mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                    Welcome back, {studentInfo?.fullName?.split(' ')[0] || 'Student'}! 👋
                  </h1>
                </motion.div>
                <motion.p 
                  className="text-base sm:text-lg opacity-90 mb-3 sm:mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {studentInfo?.schoolName} • Grade {studentInfo?.grade}
                </motion.p>
                <motion.p 
                  className="text-sm sm:text-base text-white/80 max-w-2xl"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Continue your learning journey or explore new topics today!
                </motion.p>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="hover:shadow-2xl transition-all duration-300 group cursor-pointer border-2 border-transparent hover:border-indigo-400 dark:hover:border-indigo-600 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <CardContent className="p-4 sm:p-6">
                    <motion.div 
                      className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                    >
                      <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
                    </motion.div>
                    <motion.div 
                      className="text-3xl sm:text-4xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm font-medium text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {stat.label}
                    </div>
                    {stat.subtext && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {stat.subtext}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
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
                                  <svg className="w-16 h-16 sm:w-20 sm:h-20">
                                    <circle
                                      cx="50%"
                                      cy="50%"
                                      r="30"
                                      stroke="currentColor"
                                      strokeWidth="6"
                                      fill="none"
                                      className="text-gray-200 dark:text-gray-700"
                                    />
                                    <circle
                                      cx="50%"
                                      cy="50%"
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
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs sm:text-sm font-bold">{percentage}%</span>
                                  </div>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={action.action}
                        className="text-left p-5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all group shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                      >
                        <motion.div 
                          className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3 shadow-xl`}
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.7, ease: "easeInOut" }}
                        >
                          <action.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
                        </motion.div>
                        <h3 className="font-semibold text-base sm:text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          {action.title}
                          <motion.div
                            initial={{ x: 0 }}
                            whileHover={{ x: 5 }}
                          >
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              {recentLessons.length > 0 && (
                <Card className="mt-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        Continue Learning
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/my-learning')}
                        className="text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 group"
                      >
                        View All
                        <motion.div
                          className="inline-block ml-1"
                          whileHover={{ x: 5 }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {recentLessons.map((lesson, idx) => {
                        const isCompleted = progress.some(
                          p => p.lessonId === lesson.id && p.completed
                        );
                        
                        return (
                          <motion.button
                            key={lesson.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.02, x: 5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)" }}
                            onClick={() => {
                              // Navigate to subject page instead of individual lesson
                              navigate(`/subjects/${lesson.grade}/${lesson.subject}${lesson.term ? `?term=${lesson.term}` : ''}`);
                            }}
                            className="w-full p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all text-left group shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                          >
                            <div className="flex items-start gap-4">
                              <motion.div 
                                className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl"
                                whileHover={{ scale: 1.15, rotate: 10 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <BookOpen className="w-7 h-7 text-white drop-shadow-lg" />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                  {lesson.title}
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                  {lesson.description}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.subject}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Grade {lesson.grade}
                                  </Badge>
                                  {isCompleted && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring" }}
                                    >
                                      <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-lg">
                                        <motion.div
                                          animate={{ scale: [1, 1.1, 1] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                          className="flex items-center"
                                        >
                                          <Award className="w-3 h-3 mr-1" />
                                          Completed
                                        </motion.div>
                                      </Badge>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <PlayCircle className="w-5 h-5 text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                              </motion.div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Sidebar - Gamification Widgets */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
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
                <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-200 dark:border-blue-900/30">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Recommended for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                        <h4 className="font-semibold text-sm mb-1">
                          Focus on {analyticsData.weakest.subject}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          You're at {analyticsData.weakest.percentage}% completion. Let's improve!
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const lesson = enrolledLessons.find(l => l.subject === analyticsData.weakest?.subject);
                            if (lesson) {
                              navigate(`/subjects/${lesson.grade}/${lesson.subject}${lesson.term ? `?term=${lesson.term}` : ''}`);
                            }
                          }}
                        >
                          Continue Learning
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestion Box - below Recommended for You */}
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
