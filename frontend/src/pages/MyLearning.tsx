import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  PlayCircle,
  CheckCircle,
  BarChart3,
  Search,
  Filter,
  Award,
  Target,
  Zap,
  Star,
  Calendar,
  Sparkles,
  GraduationCap,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Flame,
  BarChart2,
  Brain,
  Timer
} from "lucide-react";
import { getStudentByUserId } from "@/api/students";
import { getLessons, type Lesson } from "@/api/lessons";
import { getUserProgress, type UserProgress } from "@/api/progress";
import { getEnrollments, type Enrollment } from "@/api/enrollments";
import { isEnrolled as isEnrolledUtil } from "@/utils/enrollmentUtils";
import { getPublicAdvancedSettings } from "@/api/settings";

interface EnrolledCourse {
  subject: string;
  grade: string;
  term?: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  lessonsInProgress: number;   // started (videoPosition > 0) but not yet completed
  progress: number;           // weighted: completed + partial video watch %
  lastAccessed?: Date;
  nextLesson?: Lesson;
  thumbnailUrl?: string;
  averageScore?: number;
  enrollmentDate?: Date;
}

const MyLearning = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>("");
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    getPublicAdvancedSettings()
      .then((s) => setItemsPerPage(s.myLearningPerPage ?? 9))
      .catch(() => {});
    document.title = 'My Learning | Mindsta';
    return () => { document.title = 'Mindsta'; };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoadingData(true);
        const [studentData, lessons, progress, enrollmentsData] = await Promise.all([
          getStudentByUserId(user.id),
          getLessons(undefined, undefined, undefined, true),
          getUserProgress(user.id),
          getEnrollments(),
        ]);

        if (studentData) {
          setStudentName(studentData.fullName);
        }

        setAllLessons(lessons);
        setUserProgress(progress);
        setEnrollments(enrollmentsData);

        // Filter lessons to only include enrolled ones.
        // Per-lesson enrollments (enrollment.lessonId is set) only grant access to that specific
        // lesson; subject-level enrollments grant access to all lessons in the subject.
        // Only active (paid, non-cancelled) enrollments are considered.
        const activeEnrollments = enrollmentsData.filter(e => e.isActive);
        const enrolledLessons = lessons.filter(lesson => {
          return activeEnrollments.some(enrollment => {
            if (enrollment.lessonId) {
              return isEnrolledUtil(enrollment, lesson.subject, lesson.grade, lesson.term, lesson.id);
            }
            return isEnrolledUtil(enrollment, lesson.subject, lesson.grade, lesson.term);
          });
        });

        // Helper: determine the course map key for a lesson.
        // Per-lesson enrollments get their own card (keyed by lessonId) so the student only
        // sees the lessons they actually purchased, not every lesson in the subject.
        const courseKeyForLesson = (lesson: { id: string; subject: string; grade: string; term?: string }) => {
          const perLesson = activeEnrollments.find(e =>
            e.lessonId && isEnrolledUtil(e, lesson.subject, lesson.grade, lesson.term, lesson.id)
          );
          return perLesson
            ? `${lesson.subject}-${lesson.grade}-${lesson.term || 'general'}-${lesson.id}`
            : `${lesson.subject}-${lesson.grade}-${lesson.term || 'general'}`;
        };

        // Group lessons by subject/grade/term (or lessonId for per-lesson purchases) to create "lessons"
        const courseMap = new Map<string, EnrolledCourse>();
        
        // First, create entries for all ACTIVE enrollments (even if no lessons exist yet).
        // Per-lesson enrollments use a lessonId-suffixed key so they appear as separate cards.
        for (const enrollment of activeEnrollments) {
          const key = enrollment.lessonId
            ? `${enrollment.subject}-${enrollment.grade}-${enrollment.term || 'general'}-${enrollment.lessonId}`
            : `${enrollment.subject}-${enrollment.grade}-${enrollment.term || 'general'}`;
          
          if (!courseMap.has(key)) {
            courseMap.set(key, {
              subject: enrollment.subject,
              grade: enrollment.grade,
              term: enrollment.term,
              lessonsTotal: 0,
              lessonsCompleted: 0,
              lessonsInProgress: 0,
              progress: 0,
              nextLesson: undefined,
              averageScore: undefined,
              enrollmentDate: new Date(enrollment.purchasedAt || enrollment.createdAt),
            });
          }
        }
        
        // Accumulate weighted progress per course key
        const progressWeights = new Map<string, number>();

        // Then add lesson data to existing enrollments
        for (const lesson of enrolledLessons) {
          const key = courseKeyForLesson(lesson);

          // Only process if this enrollment exists (it should, from the loop above)
          if (courseMap.has(key)) {
            const course = courseMap.get(key)!;
            course.lessonsTotal += 1;

            const lessonProgress = progress.find(p => p.lessonId === lesson.id);
            if (lessonProgress) {
              if (lessonProgress.completed) {
                course.lessonsCompleted += 1;
                progressWeights.set(key, (progressWeights.get(key) || 0) + 1);
              } else {
                course.lessonsInProgress += 1;
                const watchPct = (lessonProgress.videoWatchPercent || 0) / 100;
                // Cap partial credit at 99% (only mark complete when fully complete)
                progressWeights.set(key, (progressWeights.get(key) || 0) + Math.min(watchPct, 0.99));
              }

              // Track last accessed
              const accessedDate = new Date(lessonProgress.lastAccessedAt);
              if (!course.lastAccessed || accessedDate > course.lastAccessed) {
                course.lastAccessed = accessedDate;
              }

              // Find next incomplete lesson
              if (!lessonProgress.completed && !course.nextLesson) {
                course.nextLesson = lesson;
              }
            } else if (!course.nextLesson) {
              // First unstarted lesson
              course.nextLesson = lesson;
            }

            // Capture first available thumbnail from any lesson
            if (!course.thumbnailUrl && lesson.imageUrl) {
              course.thumbnailUrl = lesson.imageUrl;
            }

            // Calculate average score
            const scoresForCourse = progress
              .filter(p => {
                const l = enrolledLessons.find(les => les.id === p.lessonId);
                return l && l.subject === course.subject && l.grade === course.grade && l.term === course.term && typeof p.quizScore === 'number';
              })
              .map(p => p.quizScore!);

            if (scoresForCourse.length > 0) {
              course.averageScore = Math.round(scoresForCourse.reduce((a, b) => a + b, 0) / scoresForCourse.length);
            }
          }
        }

        // Calculate weighted progress percentages (includes partial video watch)
        courseMap.forEach((course, key) => {
          const weight = progressWeights.get(key) || 0;
          course.progress = course.lessonsTotal > 0
            ? Math.round((weight / course.lessonsTotal) * 100)
            : 0;
        });

        const enrolledlessons = Array.from(courseMap.values());

        setEnrolled(enrolledlessons);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredAndSorted = () => {
    let filtered = enrolled;

    // Filter by subject
    if (filterSubject !== "all") {
      filtered = filtered.filter(c => c.subject === filterSubject);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(query) ||
        c.grade.toLowerCase().includes(query) ||
        c.term?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "recent") {
      // Sort by enrollment date (newest purchases first), then by last accessed
      filtered.sort((a, b) => {
        // First priority: enrollment date (newest first)
        if (a.enrollmentDate && b.enrollmentDate) {
          const dateDiff = b.enrollmentDate.getTime() - a.enrollmentDate.getTime();
          if (dateDiff !== 0) return dateDiff;
        }
        if (a.enrollmentDate && !b.enrollmentDate) return -1;
        if (!a.enrollmentDate && b.enrollmentDate) return 1;
        
        // Second priority: last accessed
        if (!a.lastAccessed) return 1;
        if (!b.lastAccessed) return -1;
        return b.lastAccessed.getTime() - a.lastAccessed.getTime();
      });
    } else if (sortBy === "progress") {
      filtered.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.subject.localeCompare(b.subject));
    }

    return filtered;
  };

  const uniqueSubjects = Array.from(new Set(enrolled.map(c => c.subject)));

  // ─── Study Activity: 52-week daily access heatmap ───────────────────────────
  const activityHeatmap = (() => {
    // Build a map of date-string → number of lessons accessed
    const dayMap = new Map<string, number>();
    userProgress.forEach(p => {
      if (!p.lastAccessedAt) return;
      const d = new Date(p.lastAccessedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dayMap.set(key, (dayMap.get(key) || 0) + 1);
    });

    // Build 52 complete weeks (364 days) ending today, Sunday-first
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Pad to the start of the week containing today
    const dayOfWeek = today.getDay(); // 0=Sun
    const gridEnd = new Date(today);
    gridEnd.setDate(today.getDate() + (6 - dayOfWeek)); // end on Saturday
    const gridStart = new Date(gridEnd);
    gridStart.setDate(gridEnd.getDate() - 52 * 7 + 1);

    const weeks: { date: Date; count: number; isToday: boolean; isFuture: boolean }[][] = [];
    let week: { date: Date; count: number; isToday: boolean; isFuture: boolean }[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      const isToday = cursor.toDateString() === today.toDateString();
      const isFuture = cursor > today;
      week.push({ date: new Date(cursor), count: dayMap.get(key) || 0, isToday, isFuture });
      if (week.length === 7) { weeks.push(week); week = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (week.length) weeks.push(week);
    return { weeks, dayMap };
  })();

  // Current streak: consecutive days with at least one lesson accessed, counting backwards from today
  const currentStreak = (() => {
    const { dayMap } = activityHeatmap;
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      if (dayMap.get(key)) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else if (i === 0) { cursor.setDate(cursor.getDate() - 1); } // allow today to be empty
      else break;
    }
    return streak;
  })();

  // Total time spent (seconds → minutes)
  const totalMinutes = Math.round(
    userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 60
  );

  // Best subject by average score
  const bestSubject = (() => {
    const subjectScores: Record<string, number[]> = {};
    userProgress.forEach(p => {
      if (typeof p.quizScore !== 'number') return;
      const lesson = allLessons.find(l => l.id === p.lessonId);
      if (!lesson) return;
      if (!subjectScores[lesson.subject]) subjectScores[lesson.subject] = [];
      subjectScores[lesson.subject].push(p.quizScore);
    });
    let best = { subject: '', avg: 0 };
    Object.entries(subjectScores).forEach(([subject, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > best.avg) best = { subject, avg: Math.round(avg) };
    });
    return best.subject ? best : null;
  })();

  // Lessons accessed per day-of-week (0=Sun) for weekly pattern bar chart
  const weekdayActivity = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    userProgress.forEach(p => {
      if (!p.lastAccessedAt) return;
      counts[new Date(p.lastAccessedAt).getDay()]++;
    });
    return counts;
  })();
  const maxWeekday = Math.max(...weekdayActivity, 1);

  // Score distribution for sparkline: bucket completions by month (last 6 months)
  const monthlyCompletions = (() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleString('default', { month: 'short' }), count: 0 };
    });
    userProgress.filter(p => p.completed && p.completedAt).forEach(p => {
      const d = new Date(p.completedAt!);
      months.forEach((m, i) => {
        const target = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        if (d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth()) {
          months[i].count++;
        }
      });
    });
    return months;
  })();
  const maxMonthly = Math.max(...monthlyCompletions.map(m => m.count), 1);

  // Color helper for heatmap cells (0 → 4 intensity)
  const heatLevel = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-indigo-200 dark:bg-indigo-900';
    if (count === 2) return 'bg-indigo-400 dark:bg-indigo-700';
    if (count === 3) return 'bg-indigo-600 dark:bg-indigo-500';
    return 'bg-indigo-800 dark:bg-indigo-400';
  };

  // Returns true if purchased within the last 7 days
  const isNewPurchase = (enrollmentDate?: Date) => {
    if (!enrollmentDate) return false;
    const days = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSubject, sortBy]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentName} />
        {/* Hero shimmer */}
        <div className="pt-16 h-52 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 animate-pulse" />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />

      <main className="pb-16">
        {/* Gradient Hero Banner */}
        <div className="pt-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          </div>
          <div className="container mx-auto px-4 py-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium">Your Learning Space</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {studentName ? `${studentName.split(' ')[0]}'s lessons` : 'My Learning'}
                </h1>
                <p className="text-indigo-100 text-sm max-w-md">
                  {enrolled.length === 0
                    ? 'Start learning by browsing our available lessons'
                    : `${enrollments.length} lesson${enrollments.length !== 1 ? 's' : ''} purchased · ${userProgress.filter(p => p.completed).length} completed`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {enrolled.length > 0 && (() => {
                  const totalLessons = enrolled.reduce((s, c) => s + c.lessonsTotal, 0);
                  const completedLessons = userProgress.filter(p => p.completed).length;
                  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                  const r = 26; const circ = 2 * Math.PI * r;
                  return (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,0.25)" strokeWidth="5" fill="none" />
                        <circle cx="32" cy="32" r={r} stroke="white" strokeWidth="5" fill="none"
                          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                          strokeLinecap="round" transform="rotate(-90 32 32)" className="transition-all duration-1000" />
                        <text x="32" y="32" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="13" fontWeight="700">{pct}%</text>
                      </svg>
                      <div>
                        <p className="text-white font-bold text-base leading-none">{completedLessons}/{totalLessons}</p>
                        <p className="text-indigo-200 text-xs mt-0.5">lessons done</p>
                      </div>
                    </div>
                  );
                })()}
                <Button
                  onClick={() => navigate('/browse')}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold gap-2 shadow-lg flex-shrink-0"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Browse More
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">

        {/* Quick Stats */}
        {enrolled.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              {
                icon: BookOpen,
                label: 'Purchased Lessons',
                value: enrollments.length,
                gradient: 'from-purple-500 to-indigo-500',
                border: 'border-purple-200 dark:border-purple-800',
                bg: 'bg-purple-50 dark:bg-purple-950/20',
              },
              {
                icon: CheckCircle,
                label: 'Lessons Completed',
                value: userProgress.filter(p => p.completed).length,
                gradient: 'from-green-500 to-emerald-500',
                border: 'border-green-200 dark:border-green-800',
                bg: 'bg-green-50 dark:bg-green-950/20',
              },
              {
                icon: TrendingUp,
                label: 'In Progress',
                value: enrolled.reduce((sum, c) => sum + c.lessonsInProgress, 0),
                gradient: 'from-blue-500 to-cyan-500',
                border: 'border-blue-200 dark:border-blue-800',
                bg: 'bg-blue-50 dark:bg-blue-950/20',
              },
              {
                icon: BarChart3,
                label: 'Average Score',
                value: (() => {
                  const scores = userProgress.filter(p => typeof p.quizScore === 'number').map(p => p.quizScore!);
                  return scores.length > 0 ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '—';
                })(),
                gradient: 'from-orange-500 to-amber-500',
                border: 'border-orange-200 dark:border-orange-800',
                bg: 'bg-orange-50 dark:bg-orange-950/20',
              },
            ].map((stat, i) => (
              <div key={i} className={`rounded-xl border-2 ${stat.border} ${stat.bg} p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold leading-none">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search your lessons…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full border-gray-200 dark:border-gray-700"
            />
          </div>
          <div className="flex gap-3">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-40 h-10 border-gray-200 dark:border-gray-700">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {uniqueSubjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-10 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Accessed</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
                <SelectItem value="title">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* lessons Grid */}
        {filteredAndSorted().length === 0 ? (
          <Card className="p-8 sm:p-16">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                {enrollments.length === 0 ? "No enrolled lessons yet" : "No lessons found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {enrollments.length === 0 
                  ? "Purchase lessons to start your learning journey" 
                  : searchQuery || filterSubject !== "all" 
                    ? "Try adjusting your filters" 
                    : "Start learning by exploring available lessons"}
              </p>
              <Button onClick={() => navigate("/browse")}>
                Browse Lessons
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSorted()
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((course, index) => (
                <div key={index}>

                {/* ── MOBILE: Horizontal compact card (matches BrowseCourses mobile design) ── */}
                <div
                  className={`sm:hidden group rounded-2xl overflow-hidden border flex items-stretch cursor-pointer shadow-sm active:scale-[0.985] transition-all duration-150 ${
                    course.progress === 100
                      ? 'border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-gray-900'
                      : 'border-indigo-200 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/20 dark:to-gray-900'
                  }`}
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (course.term) p.set('term', course.term);
                    if (course.nextLesson?.id) p.set('lessonId', course.nextLesson.id);
                    navigate(`/subjects/${course.grade}/${course.subject}${p.toString() ? `?${p}` : ''}`);
                  }}
                >
                  {/* Left: Thumbnail strip */}
                  <div className={`relative flex-shrink-0 w-[100px] overflow-hidden ${
                    course.progress === 100
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500'
                  }`}>
                    {(course.thumbnailUrl || course.nextLesson?.imageUrl) && (
                      <img
                        src={course.thumbnailUrl || course.nextLesson!.imageUrl!}
                        alt={course.subject}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {!(course.thumbnailUrl || course.nextLesson?.imageUrl) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white/80" />
                      </div>
                    )}
                    {/* Status badge */}
                    {course.progress === 100 ? (
                      <div className="absolute top-2 left-2">
                        <div className="bg-green-600/95 backdrop-blur-sm rounded-full p-0.5 shadow">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : isNewPurchase(course.enrollmentDate) ? (
                      <div className="absolute top-2 left-2">
                        <span className="bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase leading-none">New</span>
                      </div>
                    ) : course.lessonsInProgress > 0 ? (
                      <div className="absolute top-2 left-2">
                        <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase leading-none">Active</span>
                      </div>
                    ) : null}
                    {/* Progress arc */}
                    {course.progress > 0 && course.progress < 100 && (
                      <div className="absolute bottom-2 right-2">
                        <div className="w-8 h-8 relative">
                          <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                            <circle cx="16" cy="16" r="12" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                            <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="3" fill="none"
                              strokeDasharray={`${2 * Math.PI * 12}`}
                              strokeDashoffset={`${2 * Math.PI * 12 * (1 - course.progress / 100)}`}
                              strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white rotate-90">{course.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 min-w-0 p-3 flex flex-col gap-1.5">
                    <div>
                      <h4 className={`font-bold text-[13px] leading-snug line-clamp-2 transition-colors ${
                        course.progress === 100
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}>{course.subject}</h4>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {course.grade === 'Common Entrance' ? 'CE' : `Gr. ${course.grade}`}
                        {course.term ? ` · ${course.term.replace(' Term', '')}` : ''}
                      </p>
                    </div>

                    {/* Slim progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-1 rounded-full transition-all duration-700 ${course.progress === 100 ? 'bg-green-500' : course.lessonsInProgress > 0 ? 'bg-blue-500' : 'bg-indigo-500'}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground flex-shrink-0">{course.progress}%</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                        {course.lessonsCompleted}/{course.lessonsTotal}
                      </span>
                      {course.lastAccessed && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                          {(() => {
                            const days = Math.floor((Date.now() - course.lastAccessed!.getTime()) / (1000 * 60 * 60 * 24));
                            if (days === 0) return 'Today';
                            if (days === 1) return 'Yesterday';
                            return `${days}d ago`;
                          })()}
                        </span>
                      )}
                      {typeof course.averageScore === 'number' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                          <BarChart3 className="w-2.5 h-2.5 flex-shrink-0" />
                          {course.averageScore}%
                        </span>
                      )}
                    </div>

                    {/* CTA — pinned to bottom */}
                    <div className="mt-auto pt-1">
                      <button
                        className={`w-full text-[12px] font-semibold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm text-white ${
                          course.progress === 100
                            ? 'bg-green-600 hover:bg-green-700'
                            : course.lessonsInProgress > 0
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const p = new URLSearchParams();
                          if (course.term) p.set('term', course.term);
                          if (course.nextLesson?.id) p.set('lessonId', course.nextLesson.id);
                          navigate(`/subjects/${course.grade}/${course.subject}${p.toString() ? `?${p}` : ''}`);
                        }}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {course.progress === 100
                          ? 'Review'
                          : course.lessonsInProgress > 0 || course.lessonsCompleted > 0
                          ? 'Continue'
                          : 'Start Learning'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── DESKTOP (sm+): Rich vertical card ── */}
                <Card
                  className="hidden sm:block group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (course.term) p.set('term', course.term);
                    if (course.nextLesson?.id) p.set('lessonId', course.nextLesson.id);
                    navigate(`/subjects/${course.grade}/${course.subject}${p.toString() ? `?${p}` : ''}`);
                  }}
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 overflow-hidden">
                    {(course.thumbnailUrl || course.nextLesson?.imageUrl) ? (
                      <>
                        <img 
                          src={course.thumbnailUrl || course.nextLesson!.imageUrl!} 
                          alt={course.subject}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-indigo-300" />
                      </div>
                    )}
                    {course.progress === 100 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 shadow-md">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    )}
                    {course.lessonsInProgress > 0 && course.progress < 100 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-blue-600 text-white border-0 shadow-md">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      </div>
                    )}
                    {isNewPurchase(course.enrollmentDate) && course.progress === 0 && course.lessonsInProgress === 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md">
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          New Purchase
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    {/* Course Title */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-base mb-1 group-hover:text-indigo-600 transition-colors">
                        {course.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Grade {course.grade}
                        {course.term && ` • ${course.term}`}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {course.progress}% complete
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.lessonsCompleted} completed
                        </span>
                      </div>
                      <Progress
                        value={course.progress}
                        className={`h-2 ${course.lessonsInProgress > 0 && course.progress < 100 ? '[&>div]:bg-blue-500' : ''}`}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                      {course.lastAccessed && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              const now = new Date();
                              const diff = now.getTime() - course.lastAccessed.getTime();
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              if (days === 0) return "Today";
                              if (days === 1) return "Yesterday";
                              return `${days}d ago`;
                            })()}
                          </span>
                        </div>
                      )}
                      {!course.lastAccessed && course.enrollmentDate && (
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>Purchased {(() => {
                            const days = Math.floor((Date.now() - course.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
                            if (days === 0) return 'today';
                            if (days === 1) return 'yesterday';
                            return `${days}d ago`;
                          })()}</span>
                        </div>
                      )}
                      {typeof course.averageScore === 'number' && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>{course.averageScore}% avg</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        const p = new URLSearchParams();
                        if (course.term) p.set('term', course.term);
                        if (course.nextLesson?.id) p.set('lessonId', course.nextLesson.id);
                        navigate(`/subjects/${course.grade}/${course.subject}${p.toString() ? `?${p}` : ''}`);
                      }}
                      className={`w-full gap-2 ${
                        course.progress === 100
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : course.lessonsInProgress > 0
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                          : ''
                      }`}
                      size="sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {course.progress === 100
                        ? 'Review Course'
                        : course.lessonsInProgress > 0
                        ? 'Continue Learning'
                        : course.lessonsCompleted > 0
                        ? 'Continue Learning'
                        : 'Start Course'}
                    </Button>
                  </CardContent>
                </Card>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredAndSorted().length > itemsPerPage && (
              <div className="flex flex-col items-center gap-3 mt-10 pt-6 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSorted().length)}–{Math.min(currentPage * itemsPerPage, filteredAndSorted().length)} of {filteredAndSorted().length} course{filteredAndSorted().length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* First page — desktop only */}
                  {Math.ceil(filteredAndSorted().length / itemsPerPage) > 5 && (
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
                      const totalPages = Math.ceil(filteredAndSorted().length / itemsPerPage);
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
                    onClick={() => { setCurrentPage(p => Math.min(Math.ceil(filteredAndSorted().length / itemsPerPage), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage >= Math.ceil(filteredAndSorted().length / itemsPerPage)}>
                    <span className="sr-only sm:not-sr-only">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  {Math.ceil(filteredAndSorted().length / itemsPerPage) > 5 && (
                    <Button variant="outline" size="sm" className="hidden sm:flex w-9 h-9 p-0"
                      onClick={() => { setCurrentPage(Math.ceil(filteredAndSorted().length / itemsPerPage)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage >= Math.ceil(filteredAndSorted().length / itemsPerPage)} aria-label="Last page">
                      »
                    </Button>
                  )}
                </div>
              </div>
            )}


          </>
        )}
        </div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default MyLearning;

