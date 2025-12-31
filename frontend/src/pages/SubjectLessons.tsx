import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "@/components/StudentHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, PlayCircle, Trophy, CheckCircle, BookOpen, Clock, Lock, ShoppingCart } from "lucide-react";
import { getLessonsBySubjectAndGrade, getUserProgress, getStudentByUserId } from "@/api";
import { checkAccess } from "@/api/enrollments";

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface Progress {
  lessonId: string;
  completed: boolean;
}

const SubjectLessons = () => {
  const { grade, subject } = useParams();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [lessonSearch, setLessonSearch] = useState("");
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(true);

  // Get term from URL query params
  const termParam = searchParams.get('term');
  const gradeParam = searchParams.get('grade') || grade;
  
  // Convert subject slug to proper format (e.g., "english-language" -> "English Language")
  const subjectName = subject ? subject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchLessonsAndProgress = async () => {
      if (!user || !gradeParam || !subjectName) return;

      try {
        setCheckingAccess(true);
        
        // Check if user has access to this course
        const termName = termParam ? termParam.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : undefined;
        const accessCheck = await checkAccess(subjectName, gradeParam, termName);
        setHasAccess(accessCheck.hasAccess);

        // Fetch student name
        const studentData = await getStudentByUserId(user.id);
        if (studentData) {
          setStudentName(studentData.fullName);
        }

        // Fetch lessons with optional term filter
        const lessonsData = await getLessonsBySubjectAndGrade(
          subjectName, 
          gradeParam,
          termName
        );

        // Fetch user progress
        const progressData = await getUserProgress(user.id);

        setLessons(lessonsData.map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
        })));
        setProgress(progressData.map(p => ({
          lessonId: p.lessonId,
          completed: p.completed,
        })));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
        setCheckingAccess(false);
      }
    };

    fetchLessonsAndProgress();
  }, [user, gradeParam, subjectName, termParam]);

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  if (loading || loadingData || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentName} />
        <div className="pt-24 container mx-auto px-4 flex items-center justify-center" style={{minHeight: 'calc(100vh - 96px)'}}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-muted-foreground">Loading lessons…</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user hasn't purchased this course
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentName} />
        <main className="pt-24 pb-16 container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/browse')}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Button>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Course Not Purchased</h2>
              <p className="text-muted-foreground mb-6">
                You need to purchase this course to access its lessons.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-1">{subjectName}</h3>
                <p className="text-sm text-muted-foreground">
                  Grade {gradeParam}{termParam ? ` • ${termParam.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}` : ''}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/browse')} variant="outline">
                  Browse Courses
                </Button>
                <Button onClick={() => navigate('/cart')} className="gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Go to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const completedCount = lessons.filter(l => isLessonCompleted(l.id)).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />

      <main className="pt-24 pb-16 container mx-auto px-4">
        {/* Breadcrumb & Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (termParam && gradeParam) {
                navigate(`/grade/${gradeParam}/term/${termParam}`);
              } else {
                navigate(`/dashboard`);
              }
            }}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back {termParam ? 'to Term' : 'to Dashboard'}
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {subjectName}
              </h1>
              <p className="text-muted-foreground">
                Grade {gradeParam}{termParam ? ` • ${termParam.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}` : ''}
              </p>
            </div>

            {/* Progress Overview */}
            {lessons.length > 0 && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{completedCount}/{lessons.length}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{progressPercent}%</div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {lessons.length > 0 && (
            <div className="mt-4">
              <Progress value={progressPercent} className="h-3" />
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <Input 
            placeholder="Search lessons..." 
            value={lessonSearch}
            onChange={(e) => setLessonSearch(e.target.value)} 
          />
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          {lessons
            .filter(l => !lessonSearch || l.title.toLowerCase().includes(lessonSearch.toLowerCase()) || (l.description || '').toLowerCase().includes(lessonSearch.toLowerCase()))
            .map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id);
              return (
                <Card
                  key={lesson.id}
                  className="group hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/grade/${gradeParam}/${subject}/lesson/${lesson.id}`)}
                >
                  <div className="flex items-center gap-4 p-5">
                    {/* Lesson Number */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${completed ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'}`}>
                      {completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base group-hover:text-purple-600 transition-colors mb-1">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {lesson.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {completed ? (
                      <Badge variant="secondary" className="gap-1 flex-shrink-0">
                        <Trophy className="w-3 h-3" /> Completed
                      </Badge>
                    ) : (
                      <PlayCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </Card>
              );
            })}

          {lessons.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-base text-muted-foreground font-semibold mb-1">No lessons available</p>
                <p className="text-sm text-muted-foreground">Check back soon for new content.</p>
              </CardContent>
            </Card>
          )}

          {lessons.length > 0 && lessons.filter(l => !lessonSearch || l.title.toLowerCase().includes(lessonSearch.toLowerCase())).length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-base text-muted-foreground font-semibold mb-1">No lessons found</p>
                <p className="text-sm text-muted-foreground">Try a different search term.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubjectLessons;
