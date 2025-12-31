import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "@/components/StudentHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Clock, 
  TrendingUp, 
  PlayCircle,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { getStudentByUserId, getLessons, getUserProgress, type Lesson, type UserProgress } from "@/api";
import { getEnrollments, type Enrollment } from "@/api/enrollments";

interface EnrolledCourse {
  subject: string;
  grade: string;
  term?: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  progress: number;
  lastAccessed?: Date;
  nextLesson?: Lesson;
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
            enrollment.subject === lesson.subject &&
            enrollment.grade === lesson.grade &&
            enrollment.term === lesson.term
          );
        });

        // Group lessons by subject/grade/term to create "courses"
        const courseMap = new Map<string, EnrolledCourse>();
        
        for (const lesson of enrolledLessons) {
          const key = `${lesson.subject}-${lesson.grade}-${lesson.term || 'general'}`;
          
          if (!courseMap.has(key)) {
            // Find the enrollment for this course to get purchase date
            const enrollment = enrollmentsData.find(e => 
              e.subject === lesson.subject && 
              e.grade === lesson.grade && 
              e.term === lesson.term
            );
            
            courseMap.set(key, {
              subject: lesson.subject,
              grade: lesson.grade,
              term: lesson.term,
              lessonsTotal: 0,
              lessonsCompleted: 0,
              progress: 0,
              nextLesson: undefined,
              averageScore: undefined,
              enrollmentDate: enrollment ? new Date(enrollment.purchasedAt || enrollment.createdAt) : undefined,
            });
          }

          const course = courseMap.get(key)!;
          course.lessonsTotal += 1;

          const lessonProgress = progress.find(p => p.lessonId === lesson.id);
          if (lessonProgress) {
            if (lessonProgress.completed) {
              course.lessonsCompleted += 1;
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

        // Calculate progress percentages
        courseMap.forEach((course) => {
          course.progress = course.lessonsTotal > 0 
            ? Math.round((course.lessonsCompleted / course.lessonsTotal) * 100)
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
          <h1 className="text-3xl font-bold text-foreground mb-2">My Learning</h1>
          <p className="text-muted-foreground">Continue where you left off and track your progress</p>
        </div>

        {/* Quick Stats Section */}
        {enrolled.length > 0 && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-300" />
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
                    <p className="text-2xl md:text-3xl font-bold">{enrolled.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Active Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                    <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-purple-300" />
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
                {enrollments.length === 0 ? "No enrolled courses yet" : "No courses found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {enrollments.length === 0 
                  ? "Purchase courses to start your learning journey" 
                  : searchQuery || filterSubject !== "all" 
                    ? "Try adjusting your filters" 
                    : "Start learning by exploring available subjects"}
              </p>
              <Button onClick={() => navigate("/browse")}>
                Browse Courses
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted().map((course, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                onClick={() => {
                  const subjectSlug = course.subject.toLowerCase().replace(/\s+/g, '-');
                  const termSlug = course.term ? course.term.toLowerCase().replace(/\s+/g, '-') : '';
                  navigate(`/subject/${subjectSlug}?grade=${course.grade}${termSlug ? `&term=${termSlug}` : ''}`);
                }}
              >
                {/* Course Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white opacity-80" />
                  </div>
                  {course.progress === 100 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
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
                        {course.lessonsCompleted}/{course.lessonsTotal} lessons
                      </span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
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
                    {typeof course.averageScore === 'number' && (
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{course.averageScore}% avg</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {course.nextLesson && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        const subjectSlug = course.subject.toLowerCase().replace(/\s+/g, '-');
                        navigate(`/grade/${course.grade}/${subjectSlug}/lesson/${course.nextLesson!.id}`);
                      }}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {course.progress > 0 ? "Continue Learning" : "Start Course"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyLearning;

