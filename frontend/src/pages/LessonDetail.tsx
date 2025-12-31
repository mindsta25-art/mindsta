import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "@/components/StudentHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Quiz } from "@/components/Quiz";
import CurriculumDisplay from "@/components/CurriculumDisplay";
import { ArrowLeft, BookOpen, Brain, CheckCircle, PlayCircle, FileText, List, Lock, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { getLessonById, getQuizByLessonId, upsertProgress, getStudentByUserId, getUserProgress, type Lesson, type Section, type Lecture } from "@/api";
import { checkAccess } from "@/api/enrollments";

interface LessonData {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string | null;
  term?: string;
  curriculum?: Section[];
  whatYouWillLearn?: string[];
  requirements?: string[];
  targetAudience?: string[];
}

interface QuizData {
  id: string;
  title: string;
}

// Shape expected by <Quiz /> component
interface QuizUIQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_number: number;
}

const LessonDetail = () => {
  const { grade, subject, lessonId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState<string>("");
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<QuizUIQuestion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [quizAlreadyPassed, setQuizAlreadyPassed] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) return;

      try {
        setCheckingAccess(true);
        
        // Fetch student name
        if (user) {
          const studentData = await getStudentByUserId(user.id);
          if (studentData) {
            setStudentName(studentData.fullName);
          }
        }

        // Fetch lesson
        const lessonData = await getLessonById(lessonId);
        setLesson({
          id: lessonData.id,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          videoUrl: lessonData.videoUrl,
          term: (lessonData as any).term,
          curriculum: lessonData.curriculum,
          whatYouWillLearn: lessonData.whatYouWillLearn,
          requirements: lessonData.requirements,
          targetAudience: lessonData.targetAudience,
        });

        // Check access after we have lesson data
        const accessCheck = await checkAccess(
          lessonData.subject, 
          lessonData.grade, 
          (lessonData as any).term
        );
        setHasAccess(accessCheck.hasAccess);

        // Set initial lecture if curriculum exists
        if (lessonData.curriculum && lessonData.curriculum.length > 0) {
          const firstSection = lessonData.curriculum[0];
          if (firstSection.lectures && firstSection.lectures.length > 0) {
            setCurrentLecture(firstSection.lectures[0]);
          }
        }

    // Fetch quiz
    const quizData = await getQuizByLessonId(lessonId);

        if (quizData) {
          setQuiz({
            id: quizData.id,
            title: quizData.title,
          });
          const mapped = (quizData.questions || []).map((q, idx) => ({
            id: q.id || String(idx + 1),
            question: q.question,
            options: q.options,
            correct_answer: q.options[q.correctAnswer] ?? '',
            explanation: q.explanation || null,
            order_number: idx + 1,
          }));
          setQuestions(mapped);
        }

        // Check if user already passed the quiz with 80%+
        if (user && lessonId) {
          const progressData = await getUserProgress(user.id);
          const lessonProgress = progressData.find(p => p.lessonId === lessonId);
          if (lessonProgress && lessonProgress.quizScore !== undefined && lessonProgress.quizScore >= 80) {
            setQuizAlreadyPassed(true);
            setPreviousScore(lessonProgress.quizScore);
          }
        }
      } catch (error: any) {
        console.error("Error fetching lesson data:", error);
        toast({
          title: "Error loading lesson",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
        setCheckingAccess(false);
      }
    };

    fetchLessonData();
  }, [lessonId, toast, user]);

  const handleLectureClick = (sectionIndex: number, lectureIndex: number, lecture: Lecture) => {
    setCurrentLecture(lecture);
    setShowCurriculum(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasCurriculum = lesson?.curriculum && lesson.curriculum.length > 0;
  const hasLegacyContent = lesson?.content && lesson.content.trim().length > 0;

  const handleQuizComplete = async (score: number) => {
    if (!user || !lessonId) return;

    try {
      await upsertProgress({
        userId: user.id,
        lessonId,
        completed: score >= 80,
        quizScore: score,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      });

      toast({
        title: score >= 80 ? "🎉 Amazing Job!" : "Please try again",
        description:
          score >= 80
            ? "You're a superstar! Lesson complete! 🏆"
            : "Review the answers and try again until you hit 80% or above.",
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  if (loading || loadingData || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentName} />
        <div className="pt-24 container mx-auto px-4 flex items-center justify-center" style={{minHeight: 'calc(100vh - 96px)'}}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user hasn't purchased this course
  if (!hasAccess && lesson) {
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
              <h2 className="text-2xl font-bold mb-2">Lesson Locked</h2>
              <p className="text-muted-foreground mb-6">
                Purchase this course to access this lesson and all course materials.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-1">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentName} />
        <div className="pt-24 container mx-auto px-4 flex items-center justify-center" style={{minHeight: 'calc(100vh - 96px)'}}>
          <div className="text-center">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-xl font-bold text-muted-foreground mb-4">Lesson not found</p>
            <Button 
              onClick={() => navigate(`/grade/${grade}/${subject}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />

      <main className="pt-20 pb-16">
        {/* Video/Content Player - Full Width */}
        <div className="bg-black">
          <div className="container mx-auto px-4 py-6">
            <div className="w-full max-w-7xl mx-auto">
              {currentLecture?.videoUrl ? (
                <VideoPlayer 
                  videoUrl={currentLecture.videoUrl} 
                  title={currentLecture.title}
                  enableDownload={true}
                />
              ) : currentLecture?.content ? (
                <div className="aspect-video w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                  <div className="w-full h-full overflow-y-auto p-8">
                    <div className="prose prose-lg max-w-none dark:prose-invert">
                      <ReactMarkdown>{currentLecture.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : lesson?.videoUrl ? (
                <VideoPlayer 
                  videoUrl={lesson.videoUrl} 
                  title={lesson.title}
                  enableDownload={true}
                />
              ) : (
                <div className="aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No video available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area with Sidebar Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb & Actions */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/grade/${grade}/${subject}`)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {subject?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Button>

              {hasCurriculum && (
                <Button
                  variant="outline"
                  onClick={() => setShowCurriculum(!showCurriculum)}
                  className="gap-2 lg:hidden"
                >
                  <List className="w-4 h-4" />
                  {showCurriculum ? 'Hide' : 'Show'} Curriculum
                </Button>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Lecture Title */}
                {currentLecture && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2">
                      Currently Viewing
                    </Badge>
                    <h2 className="text-2xl font-bold">{currentLecture.title}</h2>
                  </div>
                )}

                {/* Course Info Card */}
                <Card>
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-3">
                      {subject?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                    <h1 className="text-3xl font-bold mb-3">{lesson.title}</h1>
                    <p className="text-muted-foreground text-lg">{lesson.description}</p>
                  </CardContent>
                </Card>

                {/* Tabs for Different Sections */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="overview" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="gap-2" disabled={questions.length === 0}>
                      <Brain className="w-4 h-4" />
                      Quiz {questions.length > 0 && `(${questions.length})`}
                      {quizAlreadyPassed && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          ✓ Passed ({previousScore}%)
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <div className="space-y-6">
                      {/* What You'll Learn */}
                      {lesson.whatYouWillLearn && lesson.whatYouWillLearn.length > 0 && (
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-4">What you'll learn</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                              {lesson.whatYouWillLearn.map((item, index) => (
                                <div key={index} className="flex gap-3">
                                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Requirements */}
                      {lesson.requirements && lesson.requirements.length > 0 && (
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-4">Requirements</h3>
                            <ul className="space-y-2">
                              {lesson.requirements.map((item, index) => (
                                <li key={index} className="flex gap-3">
                                  <span className="text-muted-foreground">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Target Audience */}
                      {lesson.targetAudience && lesson.targetAudience.length > 0 && (
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-4">Who this course is for</h3>
                            <ul className="space-y-2">
                              {lesson.targetAudience.map((item, index) => (
                                <li key={index} className="flex gap-3">
                                  <span className="text-muted-foreground">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Mobile Curriculum View */}
                      {hasCurriculum && (
                        <div className="lg:hidden">
                          <CurriculumDisplay
                            sections={lesson.curriculum!}
                            onLectureClick={handleLectureClick}
                            currentLectureId={currentLecture?._id}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content">
                    <Card>
                      <CardContent className="p-8">
                        {currentLecture?.content ? (
                          <div className="prose prose-lg max-w-none dark:prose-invert">
                            <ReactMarkdown>{currentLecture.content}</ReactMarkdown>
                          </div>
                        ) : hasLegacyContent ? (
                          <div className="prose prose-lg max-w-none dark:prose-invert">
                            <ReactMarkdown>{lesson.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No additional content available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {questions.length > 0 && (
                      <div className="mt-6 text-center">
                        <Button 
                          size="lg" 
                          onClick={() => setActiveTab("quiz")}
                          className="gap-2"
                        >
                          <Brain className="w-5 h-5" />
                          Ready? Take the Quiz
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Quiz Tab */}
                  <TabsContent value="quiz">
                    {quizAlreadyPassed && (
                      <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <div>
                              <h3 className="font-bold text-green-900 dark:text-green-100">Quiz Already Completed!</h3>
                              <p className="text-sm text-green-700 dark:text-green-300">You scored {previousScore}% on this quiz. You can retake it to improve your score.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {questions.length > 0 ? (
                      <Quiz
                        questions={questions}
                        quizTitle={quiz?.title || "Quiz"}
                        onComplete={handleQuizComplete}
                        onBackToTopic={() => {
                          setActiveTab("content");
                        }}
                        onBackToSubject={() => {
                          navigate("/my-learning");
                        }}
                        onBackToClassroom={() => {
                          navigate("/dashboard");
                        }}
                        lessonTitle={lesson.title}
                        subject={subject || undefined}
                        grade={grade || undefined}
                        term={lesson?.term || undefined}
                      />
                    ) : (
                      <Card>
                        <CardContent className="py-16 text-center">
                          <div className="text-6xl mb-4">🎮</div>
                          <p className="text-xl font-bold text-muted-foreground mb-2">No quiz yet!</p>
                          <p className="text-muted-foreground">Check back soon for a quiz on this lesson.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar - Curriculum (Desktop Only) */}
              {hasCurriculum && (
                <div className="lg:col-span-1 hidden lg:block">
                  <div className="sticky top-24">
                    <CurriculumDisplay
                      sections={lesson.curriculum!}
                      onLectureClick={handleLectureClick}
                      currentLectureId={currentLecture?._id}
                    />
                  </div>
                </div>
              )}

              {/* Mobile Curriculum Overlay */}
              {hasCurriculum && showCurriculum && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowCurriculum(false)}>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4">
                      <Button
                        variant="ghost"
                        onClick={() => setShowCurriculum(false)}
                        className="mb-4"
                      >
                        Close
                      </Button>
                      <CurriculumDisplay
                        sections={lesson.curriculum!}
                        onLectureClick={handleLectureClick}
                        currentLectureId={currentLecture?._id}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default LessonDetail;
