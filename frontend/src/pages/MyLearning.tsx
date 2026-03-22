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
  ShoppingBag
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
          getLessons(),
          getUserProgress(user.id),
          getEnrollments(),
        ]);

        if (studentData) {
          setStudentName(studentData.fullName);
        }

        setAllLessons(lessons);
        setUserProgress(progress);
        setEnrollments(enrollmentsData);

        // Filter lessons to only include enrolled courses
        const enrolledLessons = lessons.filter(lesson => {
          return enrollmentsData.some(enrollment => 
            isEnrolledUtil(enrollment, lesson.subject, lesson.grade, lesson.term)
          );
        });

        // Group lessons by subject/grade/term to create "courses"
        const courseMap = new Map<string, EnrolledCourse>();
        
        // First, create entries for all enrollments (even if no lessons exist yet)
        for (const enrollment of enrollmentsData) {
          const key = `${enrollment.subject}-${enrollment.grade}-${enrollment.term || 'general'}`;
          
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
          const key = `${lesson.subject}-${lesson.grade}-${lesson.term || 'general'}`;

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
                const watchPct = (lessonProgress.videoWatchPercent || 0) / 100;
                const hasStarted = watchPct > 0 || (lessonProgress.videoPosition || 0) > 2;
                if (hasStarted) {
                  course.lessonsInProgress += 1;
                  // Cap partial credit at 99% (only mark complete when fully complete)
                  progressWeights.set(key, (progressWeights.get(key) || 0) + Math.min(watchPct, 0.99));
                }
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

        // Show all enrolled courses (even if not started yet)
        const enrolledCourses = Array.from(courseMap.values());

        setEnrolled(enrolledCourses);
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
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />

      <main className="pt-24 pb-16 container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Lessons Courses</h1>
          <p className="text-muted-foreground">View all your purchased lessons and track your learning progress</p>
        </div>

        {/* Quick Stats Section */}
        {enrolled.length > 0 && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl md:text-3xl font-bold">{enrolled.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Purchased Subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl md:text-3xl font-bold">
                      {userProgress.filter(p => p.completed).length}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Lessons Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl md:text-3xl font-bold">
                      {enrolled.reduce((sum, c) => sum + c.lessonsInProgress, 0)}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Lessons In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
                    <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl md:text-3xl font-bold">
                      {(() => {
                        const scores = userProgress
                          .filter(p => typeof p.quizScore === 'number')
                          .map(p => p.quizScore!);
                        return scores.length > 0
                          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                          : 0;
                      })()}%
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex gap-3">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Accessed</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredAndSorted().length === 0 ? (
          <Card className="p-16">
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
                Browse Lessons expertly crafted lessons across all grades
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSorted()
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((course, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => {
                    navigate(`/subjects/${course.grade}/${course.subject}${course.term ? `?term=${course.term}` : ''}`);
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
                          {course.lessonsInProgress} In Progress
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
                          {course.lessonsCompleted}/{course.lessonsTotal} done
                          {course.lessonsInProgress > 0 && (
                            <span className="text-blue-500 ml-1">· {course.lessonsInProgress} in progress</span>
                          )}
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
                        navigate(`/subjects/${course.grade}/${course.subject}${course.term ? `?term=${course.term}` : ''}`);
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
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredAndSorted().length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-10 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const totalPages = Math.ceil(filteredAndSorted().length / itemsPerPage);
                    const pages: number[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else if (currentPage <= 4) {
                      for (let i = 1; i <= 5; i++) pages.push(i);
                      pages.push(-1);
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1);
                      pages.push(-1);
                      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      pages.push(-1);
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                      pages.push(-2);
                      pages.push(totalPages);
                    }
                    return pages.map((page, idx) =>
                      page < 0 ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={currentPage === page ? 'bg-indigo-600 hover:bg-indigo-700 text-white w-9' : 'w-9'}
                        >
                          {page}
                        </Button>
                      )
                    );
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(p => Math.min(Math.ceil(filteredAndSorted().length / itemsPerPage), p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage >= Math.ceil(filteredAndSorted().length / itemsPerPage)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Results summary */}
            <p className="text-center text-sm text-muted-foreground mt-4 pb-4">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSorted().length)}–{Math.min(currentPage * itemsPerPage, filteredAndSorted().length)} of {filteredAndSorted().length} course{filteredAndSorted().length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </main>
      <StudentFooter />
    </div>
  );
};

export default MyLearning;

