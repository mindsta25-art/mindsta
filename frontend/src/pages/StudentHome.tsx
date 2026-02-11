import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { SuggestionBox } from '@/components/SuggestionBox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Flame
} from 'lucide-react';
import { getStudentByUserId, updateStreak } from '@/api/students';
import { getUserProgress, type UserProgress } from '@/api/progress';
import { getEnrollments, type Enrollment } from '@/api/enrollments';
import { getLessons, type Lesson } from '@/api/lessons';
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
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [enrolledLessons, setEnrolledLessons] = useState<EnrolledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const recentLessons = enrolledLessons.slice(0, 3);

  const quickActions = [
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
      icon: Target,
      title: 'All Subjects',
      description: 'Browse by subject area',
      gradient: 'from-orange-500 to-red-500',
      action: () => navigate('/all-subjects'),
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
      icon: TrendingUp,
      label: 'Progress',
      value: `${completionRate}%`,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <StudentHeader studentName={studentInfo?.fullName} />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <StudentHeader studentName={studentInfo?.fullName} />
        <div className="pt-20 flex items-center justify-center min-h-screen">
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
      <WhatsAppButton />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <motion.div 
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group cursor-pointer"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
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
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Welcome back, {studentInfo?.fullName?.split(' ')[0] || 'Student'}! 👋
                  </h1>
                </motion.div>
                <motion.p 
                  className="text-lg opacity-90 mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {studentInfo?.schoolName} • Grade {studentInfo?.grade}
                </motion.p>
                <motion.p 
                  className="text-white/80 max-w-2xl"
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
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 hover:border-indigo-300 dark:hover:border-indigo-700">
                  <CardContent className="p-6">
                    <motion.div 
                      className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.div 
                      className="text-3xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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

          <div className="grid lg:grid-cols-3 gap-8">
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
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={action.action}
                        className="text-left p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all group shadow-md hover:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                      >
                        <motion.div 
                          className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center mb-3 shadow-lg`}
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6 }}
                        >
                          <action.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
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
                            whileHover={{ scale: 1.02, x: 5 }}
                            onClick={() => {
                              const subjectSlug = lesson.subject.toLowerCase().replace(/\s+/g, '-');
                              navigate(`/grade/${lesson.grade}/${subjectSlug}/lesson/${lesson.id}`);
                            }}
                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all text-left group shadow-md hover:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                          >
                            <div className="flex items-start gap-3">
                              <motion.div 
                                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                              >
                                <BookOpen className="w-6 h-6 text-white" />
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

            {/* Sidebar - Tips & Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Learning Tips */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <Sparkles className="w-5 h-5" />
                    Learning Tip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                    Set aside 30 minutes daily for consistent learning. Small, regular study sessions are more effective than cramming!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    onClick={() => navigate('/browse')}
                  >
                    Start Learning
                  </Button>
                </CardContent>
              </Card>

              {/* Explore by Grade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Explore by Grade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <Button
                        key={grade}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(`/all-grades?grade=${grade}`)}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                          {grade}
                        </div>
                        Grade {grade}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Need Help */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <BookOpen className="w-5 h-5" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Our support team is here to assist you with any questions about your learning journey.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    onClick={() => window.open(getWhatsAppUrl(), '_blank')}
                  >
                    Contact Support
                  </Button>
                </CardContent>
              </Card>

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
