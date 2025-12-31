import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Target,
  Flame,
  BarChart3,
  BookMarked,
  Trophy,
  ChevronRight,
  PlayCircle,
  ArrowRight,
  Star,
  CheckCircle,
  ShoppingCart,
  Heart,
  GraduationCap,
  Loader2
} from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import { getStudentByUserId, updateStudentGrade } from "@/api";
import { getTermsByGrade, getSubjectsByGrade, TermInfo, SubjectInfo, getLessons, getLessonsBySubjectAndGrade, type Lesson } from "@/api/lessons";
import { getUserProgress, type UserProgress } from "@/api/progress";

interface StudentInfo {
  fullName: string;
  grade: string;
  schoolName: string;
}

interface LearningStats {
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: number;
  pointsEarned: number;
  rank: string;
}

interface RecentActivity {
  id: string;
  type: 'lesson' | 'quiz' | 'achievement';
  title: string;
  subject: string;
  score?: number;
  time: string;
  icon: string;
}

interface SubjectProgress {
  name: string;
  icon: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  color: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [availableTerms, setAvailableTerms] = useState<TermInfo[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [displayedSubjects, setDisplayedSubjects] = useState<SubjectInfo[]>([]);
  const [hasMoreSubjects, setHasMoreSubjects] = useState(false);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const subjectsPerPage = 8;
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Dynamic data states
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const [termProgress, setTermProgress] = useState<SubjectProgress[]>([]);
  const [allGradeLessons, setAllGradeLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [continueData, setContinueData] = useState<{ lesson: Lesson; lastAccessed: Date } | null>(null);
  const [recommended, setRecommended] = useState<Array<{ lesson: Lesson; reason: string }>>([]);
  const [weeklySeries, setWeeklySeries] = useState<number[]>([]);
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  
  const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

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

  // Cache for subject info fetched on hover (e.g., first lesson description)
  const [subjectInfo, setSubjectInfo] = useState<Record<string, { desc?: string; loading?: boolean }>>({});
  const prefetchSubjectInfo = async (subjectName: string) => {
    if (!selectedGrade || !selectedTerm) return;
    // Avoid refetch if we already have description or in-flight loading
    const key = `${subjectName}`;
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
  };

  const handleAddToCart = async (subjectName: string, grade: string, term: string, price: number = 1200) => {
    try {
      await addToCart({ subject: subjectName, grade, term, price });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleAddToWishlist = async (subjectName: string, grade: string, term: string) => {
    try {
      await addToWishlist({ subject: subjectName, grade, term });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!user) return;

      try {
        setIsLoadingInfo(true);
        const data = await getStudentByUserId(user.id);

        if (!data) {
          console.error("Error fetching student info");
          toast({
            title: "Error",
            description: "Failed to load student information. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setStudentInfo({
          fullName: data.fullName,
          grade: data.grade,
          schoolName: data.schoolName,
        });
        
        // Set the selected grade from student info
        setSelectedGrade(data.grade);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "Failed to load student information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchStudentInfo();
  }, [user, toast]);

  // Fetch terms and all lessons in grade when grade changes
  useEffect(() => {
    const fetchTerms = async () => {
      if (!selectedGrade) return;

      try {
        setLoadingTerms(true);
        // Only fetch terms immediately - fetch lessons in background
        const terms = await getTermsByGrade(selectedGrade);
        setAvailableTerms(terms);
        
        // Reset term and subjects when grade changes
        setSelectedTerm("");
        setSubjects([]);
        setLoadingTerms(false);
        
        // Fetch all lessons for stats/progress in background (non-blocking)
        getLessons(undefined, selectedGrade).then(lessons => {
          setAllGradeLessons(lessons);
        }).catch(error => {
          console.error("Error fetching all lessons:", error);
          // Don't show error toast - this is background data
        });
      } catch (error) {
        console.error("Error fetching terms:", error);
        toast({
          title: "Error",
          description: "Failed to load terms. Please try again.",
          variant: "destructive",
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
        setDisplayedSubjects(data.slice(0, subjectsPerPage));
        setHasMoreSubjects(data.length > subjectsPerPage);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({
          title: "Error",
          description: "Failed to load subjects. Please try again.",
          variant: "destructive",
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

    const startIndex = subjectsPage * subjectsPerPage;
    const endIndex = startIndex + subjectsPerPage;
    const newSubjects = subjects.slice(startIndex, endIndex);

    if (newSubjects.length > 0) {
      setDisplayedSubjects(prev => [...prev, ...newSubjects]);
      setSubjectsPage(prev => prev + 1);
      setHasMoreSubjects(endIndex < subjects.length);
    } else {
      setHasMoreSubjects(false);
    }
  }, [subjects, subjectsPage, hasMoreSubjects, loadingSubjects, subjectsPerPage]);

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

  // Fetch user progress for dynamic stats and activity
  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        const prog = await getUserProgress(user.id);
        setUserProgress(prog || []);
      } catch (e) {
        console.error('Failed to load user progress', e);
      }
    };
    run();
  }, [user]);

  const handleGradeChange = async (grade: string) => {
    if (!user) return;
    
    try {
      setSelectedGrade(grade);
      
      // Update grade in backend
      const updated = await updateStudentGrade(user.id, grade);
      
      if (updated) {
        setStudentInfo(prev => prev ? { ...prev, grade } : null);
        toast({
          title: "Grade Updated!",
          description: `Your grade has been changed to ${grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${grade}`}`,
        });
      }
    } catch (error) {
      console.error("Error updating grade:", error);
      toast({
        title: "Error",
        description: "Failed to update grade. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Compute learning stats and recent activities when data changes
  useEffect(() => {
    if (!userProgress) return;
    // Helper maps
    const lessonMap = new Map(allGradeLessons.map(l => [l.id, l]));

    // Stats
    const totalLessonsCompleted = userProgress.filter(p => p.completed).length;
    const quizEntries = userProgress.filter(p => typeof p.quizScore === 'number');
    const totalQuizzesTaken = quizEntries.length;
    const averageScore = totalQuizzesTaken > 0 ? Math.round(quizEntries.reduce((sum, p) => sum + (p.quizScore || 0), 0) / totalQuizzesTaken) : 0;

    // Weekly progress (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekly = userProgress.filter(p => new Date(p.lastAccessedAt) >= weekAgo);
    const weeklyProgress = Math.min(100, Math.round((weekly.length / 10) * 100));

    // Weekly series for sparkline (last 7 days)
    const dayMs = 24 * 60 * 60 * 1000;
    const series: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setHours(0,0,0,0);
      const target = new Date(dayStart.getTime() - i * dayMs);
      const next = new Date(target.getTime() + dayMs);
      const count = userProgress.filter(p => {
        const t = new Date(p.lastAccessedAt).getTime();
        return t >= target.getTime() && t < next.getTime();
      }).length;
      series.push(count);
    }
    setWeeklySeries(series);

    // Streaks
    const daysWithActivity = Array.from(new Set(userProgress.map(p => new Date(p.lastAccessedAt).toDateString()))).map(d => new Date(d).getTime()).sort((a,b)=>a-b);
    let longest = 0, current = 0;
    let prevDay: number | null = null;
    const todayStr = new Date().toDateString();
    const todayMs = new Date(todayStr).getTime();
    for (const day of daysWithActivity) {
      if (prevDay === null || day - prevDay === 24*60*60*1000) {
        current += 1;
      } else {
        longest = Math.max(longest, current);
        current = 1;
      }
      prevDay = day;
    }
    longest = Math.max(longest, current);
    // If last activity not today or yesterday, current streak resets
    if (!(daysWithActivity.includes(todayMs) || daysWithActivity.includes(todayMs - 24*60*60*1000))) {
      current = 0;
    }

    // Points & rank (simple heuristics)
    const pointsEarned = totalLessonsCompleted * 20 + Math.round(quizEntries.reduce((s, p) => s + ((p.quizScore || 0)/10), 0) * 5);
    const rank = averageScore >= 85 && totalLessonsCompleted >= 20 ? 'Gold' : averageScore >= 70 ? 'Silver' : 'Bronze';

    setLearningStats({
      totalLessonsCompleted,
      totalQuizzesTaken,
      averageScore,
      currentStreak: current,
      longestStreak: longest,
      weeklyProgress,
      pointsEarned,
      rank: `${rank} Level`,
    });

    // Recent activity (latest 6)
    const recent = [...userProgress]
      .sort((a,b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 6)
      .map((p, idx) => {
        const lesson = lessonMap.get(p.lessonId);
        const isQuiz = typeof p.quizScore === 'number';
        const timeAgo = (d: Date) => {
          const now = new Date().getTime();
          const diff = Math.max(0, now - d.getTime());
          const s = Math.floor(diff / 1000);
          const m = Math.floor(s / 60);
          const h = Math.floor(m / 60);
          const dys = Math.floor(h / 24);
          if (s < 60) return `${s}s ago`;
          if (m < 60) return `${m}m ago`;
          if (h < 24) return `${h}h ago`;
          if (dys === 1) return `Yesterday`;
          return `${dys}d ago`;
        };
        return {
          id: `${idx}-${p.lessonId}`,
          type: isQuiz ? 'quiz' : 'lesson',
          title: lesson?.title || (isQuiz ? 'Quiz' : 'Lesson'),
          subject: lesson?.subject || '',
          score: isQuiz ? p.quizScore : undefined,
          time: timeAgo(new Date(p.lastAccessedAt)),
          icon: isQuiz ? '📝' : '📘',
        } as RecentActivity;
      });
    setRecentActivities(recent);

    // Term progress per grade
    const terms = ["First Term", "Second Term", "Third Term"];
    const termColors = ['bg-indigo-500','bg-cyan-500','bg-blue-500'];
    const items: SubjectProgress[] = terms.map((t, i) => {
      const lessonsInTerm = allGradeLessons.filter(l => l.term === t);
      const completedInTerm = lessonsInTerm.filter(l => userProgress.some(p => p.lessonId === l.id && p.completed)).length;
      const total = lessonsInTerm.length;
      const pct = total > 0 ? Math.round((completedInTerm / total) * 100) : 0;
      return { name: t, icon: '📚', progress: pct, lessonsCompleted: completedInTerm, totalLessons: total, color: termColors[i % termColors.length] };
    });
    setTermProgress(items);

    // Continue Learning: most recent incomplete lesson
    const incomplete = [...userProgress]
      .filter(p => !p.completed)
      .sort((a,b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    const cont = incomplete.find(p => lessonMap.has(p.lessonId));
    if (cont) {
      const lesson = lessonMap.get(cont.lessonId)!;
      setContinueData({ lesson, lastAccessed: new Date(cont.lastAccessedAt) });
    } else {
      setContinueData(null);
    }

    // Recommended for You: subjects with low avg score or low completion
    const bySubject = new Map<string, { lessons: Lesson[]; completedCount: number; total: number; scores: number[] }>();
    for (const l of allGradeLessons) {
      const entry = bySubject.get(l.subject) || { lessons: [], completedCount: 0, total: 0, scores: [] };
      entry.lessons.push(l);
      entry.total += 1;
      if (userProgress.some(p => p.lessonId === l.id && p.completed)) entry.completedCount += 1;
      const s = userProgress.find(p => p.lessonId === l.id && typeof p.quizScore === 'number')?.quizScore;
      if (typeof s === 'number') entry.scores.push(s);
      bySubject.set(l.subject, entry);
    }

    const subjectRank = Array.from(bySubject.entries()).map(([subject, info]) => {
      const completionRate = info.total > 0 ? info.completedCount / info.total : 0;
      const avgScore = info.scores.length ? info.scores.reduce((a,b)=>a+b,0) / info.scores.length : null;
      return { subject, info, completionRate, avgScore };
    })
    // Priority: low score first, then low completion
    .sort((a, b) => {
      const aScore = a.avgScore ?? 100; // if no score, deprioritize behind scored ones
      const bScore = b.avgScore ?? 100;
      if (aScore < 70 || bScore < 70) return aScore - bScore; // lower better
      return a.completionRate - b.completionRate; // lower completion first
    });

    const rec: Array<{ lesson: Lesson; reason: string }> = [];
    for (const s of subjectRank) {
      // Find next uncompleted lesson in this subject
      const sortedLessons = [...s.info.lessons].sort((a,b) => {
        const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      const next = sortedLessons.find(l => !userProgress.some(p => p.lessonId === l.id && p.completed));
      if (next) {
        let reason = '';
        if (s.avgScore !== null && s.avgScore < 70) reason = `Low quiz score: ${Math.round(s.avgScore)}%`;
        else reason = `Low completion: ${Math.round(s.completionRate * 100)}% done`;
        // Avoid duplicating the continue lesson
        if (!continueData || continueData.lesson.id !== next.id) {
          rec.push({ lesson: next, reason });
        }
      }
      if (rec.length >= 3) break;
    }
    setRecommended(rec);
  }, [userProgress, allGradeLessons]);

  if (loading || isLoadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentInfo?.fullName} />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
            Welcome back, {studentInfo?.fullName?.split(' ')[0]?.charAt(0).toUpperCase() + studentInfo?.fullName?.split(' ')[0]?.slice(1).toLowerCase() || 'Student'}
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
                      <p className="text-sm text-muted-foreground">Take our quick assessment to find your perfect learning level</p>
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
        {learningStats && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12"
          >
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Lessons</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">{learningStats.totalLessonsCompleted}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Target className="w-5 h-5 text-green-600 dark:text-green-300" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Avg Score</span>
                  </div>
                  <div className="text-3xl font-bold">{learningStats.averageScore}%</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Streak</span>
                  </div>
                  <div className="text-3xl font-bold">{learningStats.currentStreak}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Points</span>
                  </div>
                  <div className="text-3xl font-bold">{learningStats.pointsEarned}</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Continue Learning Section */}
        {continueData && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Continue Learning</h2>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="group hover:shadow-lg transition-all">
              <HoverCard openDelay={200} closeDelay={150}>
                <HoverCardTrigger asChild>
                  <div 
                    className="flex flex-col md:flex-row cursor-pointer"
                    onClick={() => {
                        const grade = selectedGrade || continueData.lesson.grade;
                        const subjectSlug = continueData.lesson.subject.toLowerCase().replace(/\s+/g, '-');
                        navigate(`/grade/${grade}/${subjectSlug}/lesson/${continueData.lesson.id}`);
                      }}
                  >
                    {/* Thumbnail */}
                    <div className="w-full md:w-80 h-40 sm:h-48 md:h-auto bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 relative flex-shrink-0 overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-white opacity-90" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="mb-3 sm:mb-4">
                        <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs sm:text-sm">
                          {continueData.lesson.subject}
                        </Badge>
                        <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {continueData.lesson.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {continueData.lesson.description}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Last accessed {(() => {
                            const now = new Date();
                            const diff = Math.floor((now.getTime() - continueData.lastAccessed.getTime()) / (1000 * 60 * 60));
                            if (diff < 1) return "just now";
                            if (diff < 24) return `${diff}h ago`;
                            const days = Math.floor(diff / 24);
                            return `${days}d ago`;
                          })()}
                        </div>
                        <Button
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            const grade = selectedGrade || continueData.lesson.grade;
                            const subjectSlug = continueData.lesson.subject.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/grade/${grade}/${subjectSlug}/lesson/${continueData.lesson.id}`);
                          }}
                          className="gap-2 w-full sm:w-auto text-sm sm:text-base"
                        >
                          <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-[calc(100vw-2rem)] sm:w-96 p-0 max-h-[80vh] overflow-y-auto" side="right" align="start" sideOffset={10}>
                  <div className="relative">
                    {/* Header with gradient */}
                    <div className="h-20 sm:h-24 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute inset-0 flex items-center px-4 sm:px-6">
                        <div className="text-white">
                          <p className="text-xs font-medium opacity-90 mb-0.5 sm:mb-1">Continue Your Journey</p>
                          <h3 className="font-bold text-base sm:text-lg line-clamp-2">{continueData.lesson.title}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Last accessed info */}
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Last Accessed</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {(() => {
                                const now = new Date();
                                const diff = Math.floor((now.getTime() - continueData.lastAccessed.getTime()) / (1000 * 60 * 60));
                                if (diff < 1) return "Just now - Keep the momentum!";
                                if (diff < 24) return `${diff} hours ago`;
                                const days = Math.floor(diff / 24);
                                return `${days} days ago`;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">What's next</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{continueData.lesson.description}</p>
                      </div>

                      {/* Meta information */}
                      <div className="grid grid-cols-3 gap-3 py-3 border-y">
                        <div className="text-center">
                          <BookMarked className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs font-medium">{continueData.lesson.subject}</p>
                          <p className="text-xs text-muted-foreground">Subject</p>
                        </div>
                        <div className="text-center">
                          <GraduationCap className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs font-medium">Grade {continueData.lesson.grade}</p>
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                        <div className="text-center">
                          {continueData.lesson.duration ? (
                            <>
                              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs font-medium">{continueData.lesson.duration} min</p>
                              <p className="text-xs text-muted-foreground">Duration</p>
                            </>
                          ) : (
                            <>
                              <Target className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs font-medium capitalize">{continueData.lesson.difficulty || 'Medium'}</p>
                              <p className="text-xs text-muted-foreground">Difficulty</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2 font-semibold"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const grade = selectedGrade || continueData.lesson.grade;
                            const subjectSlug = continueData.lesson.subject.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/grade/${grade}/${subjectSlug}/lesson/${continueData.lesson.id}`);
                          }}
                        >
                          <PlayCircle className="w-4 h-4" />
                          Continue Learning
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToWishlist(continueData.lesson.subject, continueData.lesson.grade, continueData.lesson.term);
                          }}
                          disabled={isInWishlist(continueData.lesson.subject, continueData.lesson.grade, continueData.lesson.term)}
                        >
                          <Heart className={`w-4 h-4 ${isInWishlist(continueData.lesson.subject, continueData.lesson.grade, continueData.lesson.term) ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </Card>
            </motion.div>
          </motion.div>
        )}

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
                      {[1, 2, 3, 4, 5, 6].map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                      <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!availableTerms.length}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingTerms ? "Loading..." : "Choose a term"} />
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
                      onClick={() => navigate(`/grade/${selectedGrade}/term/${term.name.toLowerCase().replace(/\s+/g, '-')}`)}
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
                      <Progress value={term.progress} className="h-1.5 sm:h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Recent Activity</h2>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 sm:space-y-4"
                >
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      variants={fadeInUp}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg transition-colors hover:bg-muted/30"
                    >
                      <div className="p-1.5 sm:p-2 bg-muted rounded-lg flex-shrink-0">
                        {activity.type === 'quiz' ? (
                          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        ) : (
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{activity.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{activity.subject}</p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {typeof activity.score === 'number' && (
                          <Badge variant={activity.score >= 80 ? "default" : "secondary"} className="text-xs">
                            {activity.score}%
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                          {activity.time}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
              <Button variant="link" onClick={() => navigate("/my-learning")} className="text-sm sm:text-base">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
            >
              {recommended.map((r, index) => (
                <motion.div key={index} variants={fadeInUp} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className="relative z-0 hover:z-10">
                  <Card className="h-full hover:shadow-lg transition-shadow group overflow-hidden">
                    <HoverCard openDelay={200} closeDelay={150}>
                      <HoverCardTrigger asChild>
                        <div
                          className="cursor-pointer h-full"
                          onClick={() => {
                            const grade = selectedGrade || r.lesson.grade;
                            const subjectSlug = r.lesson.subject.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/grade/${grade}/${subjectSlug}/lesson/${r.lesson.id}`);
                          }}
                        >
                        {/* Thumbnail with overlay */}
                        <div className="h-36 sm:h-40 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white opacity-90" />
                          </div>
                          {/* Difficulty badge */}
                          {r.lesson.difficulty && (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                              <Badge className={`text-xs font-semibold ${
                                r.lesson.difficulty === 'easy' ? 'bg-green-500' :
                                r.lesson.difficulty === 'medium' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}>
                                {r.lesson.difficulty}
                              </Badge>
                            </div>
                          )}
                          {/* Duration badge */}
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
                              {formatNaira(r.lesson.price || 1200)}
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
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[calc(100vw-2rem)] sm:w-96 p-0 max-h-[80vh] overflow-y-auto" side="right" align="start" sideOffset={10}>
                      <div className="relative">
                        {/* Header with gradient */}
                        <div className="h-20 sm:h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="absolute inset-0 flex items-center px-4 sm:px-6">
                            <div className="text-white">
                              <p className="text-xs font-medium opacity-90 mb-0.5 sm:mb-1">Recommended Lesson</p>
                              <h3 className="font-bold text-base sm:text-lg line-clamp-2">{r.lesson.title}</h3>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                          {/* Price and CTA row */}
                          <div className="flex items-center justify-between pb-4 border-b">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Course Price</p>
                              <p className="text-2xl font-bold text-indigo-600">{formatNaira(r.lesson.price || 1200)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToWishlist(r.lesson.subject, r.lesson.grade, r.lesson.term);
                                }}
                                disabled={isInWishlist(r.lesson.subject, r.lesson.grade, r.lesson.term)}
                              >
                                <Heart className={`w-4 h-4 ${isInWishlist(r.lesson.subject, r.lesson.grade, r.lesson.term) ? 'fill-current text-red-500' : ''}`} />
                              </Button>
                            </div>
                          </div>

                          {/* Why recommended */}
                          <div className="bg-indigo-50 dark:bg-purple-950/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Star className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100 mb-1">Why we recommend this</p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">{r.reason}</p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-2">What you'll learn</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{r.lesson.description}</p>
                          </div>

                          {/* Meta information */}
                          <div className="grid grid-cols-3 gap-3 py-3 border-y">
                            <div className="text-center">
                              <BookMarked className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs font-medium">{r.lesson.subject}</p>
                              <p className="text-xs text-muted-foreground">Subject</p>
                            </div>
                            <div className="text-center">
                              <GraduationCap className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs font-medium">Grade {r.lesson.grade}</p>
                              <p className="text-xs text-muted-foreground">Level</p>
                            </div>
                            <div className="text-center">
                              {r.lesson.duration ? (
                                <>
                                  <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                  <p className="text-xs font-medium">{r.lesson.duration} min</p>
                                  <p className="text-xs text-muted-foreground">Duration</p>
                                </>
                              ) : (
                                <>
                                  <Target className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                  <p className="text-xs font-medium capitalize">{r.lesson.difficulty || 'Medium'}</p>
                                  <p className="text-xs text-muted-foreground">Difficulty</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 gap-2 font-semibold"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(r.lesson.subject, r.lesson.grade, r.lesson.term, r.lesson.price || 1200);
                              }}
                              disabled={isInCart(r.lesson.subject, r.lesson.grade, r.lesson.term)}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              {isInCart(r.lesson.subject, r.lesson.grade, r.lesson.term) ? 'Added to Cart' : 'Add to Cart'}
                            </Button>
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const grade = r.lesson.grade;
                                const subjectSlug = r.lesson.subject.toLowerCase().replace(/\s+/g, '-');
                                navigate(`/grade/${grade}/${subjectSlug}/lesson/${r.lesson.id}`);
                              }}
                            >
                              <PlayCircle className="w-4 h-4" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </Card>
                </motion.div>
              ))}
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
            >
              {displayedSubjects.map((subject) => (
                <motion.div key={subject.name} variants={fadeInUp} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className="relative z-0 hover:z-10">
                  <HoverCard openDelay={150} closeDelay={100} onOpenChange={(open) => open && prefetchSubjectInfo(subject.name)}>
                    <HoverCardTrigger asChild>
                      <Card
                        className="h-full hover:shadow-md transition-shadow group cursor-pointer"
                        onClick={() => {
                          const subjectSlug = subject.name.toLowerCase().replace(/\s+/g, '-');
                          const termSlug = selectedTerm.toLowerCase().replace(/\s+/g, '-');
                          navigate(`/subject/${subjectSlug}?grade=${selectedGrade}&term=${termSlug}`);
                        }}
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

                          {/* Keep inline action buttons for mobile/no-hover environments */}
                          <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(subject.name, selectedGrade, selectedTerm, 1200);
                              }}
                              disabled={isInCart(subject.name, selectedGrade || '', selectedTerm || '')}
                            >
                              {isInCart(subject.name, selectedGrade || '', selectedTerm || '') ? 'In Cart' : `Add (${formatNaira(1200)})`}
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
                              {isInWishlist(subject.name, selectedGrade || '', selectedTerm || '') ? 'Saved' : 'Wishlist'}
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
                            <p className="font-semibold">{formatNaira(1200)}</p>
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
                              handleAddToCart(subject.name, selectedGrade, selectedTerm, 1200);
                            }}
                            disabled={isInCart(subject.name, selectedGrade || '', selectedTerm || '')}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {isInCart(subject.name, selectedGrade || '', selectedTerm || '') ? 'In Cart' : `Add (${formatNaira(1200)})`}
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
                            {isInWishlist(subject.name, selectedGrade || '', selectedTerm || '') ? 'Saved' : 'Wishlist'}
                          </Button>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Infinite scroll sentinel and loading indicator */}
            {hasMoreSubjects && (
              <div ref={observerTarget} className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </motion.div>
        )}
      </main>
      <StudentFooter />
    </div>
  );
};

export default Dashboard;

