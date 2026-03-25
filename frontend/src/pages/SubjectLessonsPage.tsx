import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "@/components/StudentHeader";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Quiz } from "@/components/Quiz";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle, 
  BookOpen, 
  Clock, 
  Lock, 
  ShoppingCart,
  Star,
  Users,
  Award,
  ChevronRight,
  FileText,
  MessageSquare,
  Info,
  Menu,
  X,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Send,
  CheckCircle2,
  Target
} from "lucide-react";
import { getLessonsBySubjectAndGrade, getUserProgress, getStudentByUserId } from "@/api";
import { recordStudyTime } from "@/api/gamification";
import { getQuizByLessonId, getQuizzesByFilters, getQuizById } from "@/api/quizzes";
import { upsertProgress } from "@/api/progress";
import { checkAccess, getEnrollments } from "@/api/enrollments";
import { isEnrolled as isEnrolledUtil } from "@/utils/enrollmentUtils";
import { getCourseReviews, getReviewStats, createCourseReview, markReviewHelpful } from "@/api/courseReviews";
import { getCourseQuestions, createCourseQuestion, addCourseAnswer, upvoteQuestion, upvoteAnswer } from "@/api/courseQuestions";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

/** Strip HTML tags and return plain text */
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

interface Lesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  overview?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  targetAudience?: string[];
  duration?: number;
  videoUrl?: string;
  imageUrl?: string;
  imageDisplaySize?: string;
  imageObjectFit?: string;
}

interface Progress {
  lessonId: string;
  completed: boolean;
}

interface QuizUIQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_number: number;
}

const SubjectLessonsPage = () => {
  const { grade, subject } = useParams();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileLessonsOpen, setMobileLessonsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizUIQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  // Track which lessons' quizzes have been passed this session
  const [quizPassedLessonIds, setQuizPassedLessonIds] = useState<Set<string>>(new Set());

  // Study time tracking
  const sessionStartRef = useRef<number>(Date.now());
  const minutesRecordedRef = useRef<number>(0);

  useEffect(() => {
    if (!hasAccess || !user) return;
    sessionStartRef.current = Date.now();
    minutesRecordedRef.current = 0;
    // Record 5 min every 5 minutes — but only when the tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        minutesRecordedRef.current += 5;
        recordStudyTime(5).catch(() => {});
      }
    }, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      // On unmount only credit active time (visible tab elapsed)
      const totalElapsed = Math.round((Date.now() - sessionStartRef.current) / 60000);
      const remaining = totalElapsed - minutesRecordedRef.current;
      if (remaining > 0 && remaining < 120 && document.visibilityState !== 'hidden') {
        recordStudyTime(remaining).catch(() => {});
      }
    };
  }, [hasAccess, user?.id]);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Q&A state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<string | null>(null);

  // Get term from URL query params
  const termParam = searchParams.get('term');
  const gradeParam = searchParams.get('grade') || grade;
  const lessonIdParam = searchParams.get('lessonId');
  
  // React Router already decodes URL params — do NOT call decodeURIComponent again
  // (double-decoding would crash on subject names containing literal '%' characters)
  const subjectName = subject ?? '';

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
        
        const termName = termParam ? termParam.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : undefined;
        // Dual check: API-level check + frontend fallback using all enrollments
        const [accessCheck, allEnrollments] = await Promise.allSettled([
          checkAccess(subjectName, gradeParam, termName),
          getEnrollments(),
        ]);

        const apiHasAccess = accessCheck.status === 'fulfilled' && accessCheck.value.hasAccess;
        const enrollmentList = allEnrollments.status === 'fulfilled' ? allEnrollments.value : [];
        const frontendHasAccess = enrollmentList.some(e =>
          isEnrolledUtil(e, subjectName, gradeParam, termName)
        );
        setHasAccess(apiHasAccess || frontendHasAccess);

        const studentData = await getStudentByUserId(user.id);
        if (studentData) {
          setStudentName(studentData.fullName);
        }

        const lessonsData = await getLessonsBySubjectAndGrade(
          subjectName, 
          gradeParam,
          termName
        );

        const progressData = await getUserProgress(user.id);

        // Fetch quizzes for the subject
        const quizzesData = await getQuizzesByFilters(subjectName, gradeParam, termName);

        setLessons(lessonsData.map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          content: l.content || '',
          overview: (l as any).overview,
          whatYouWillLearn: l.whatYouWillLearn,
          requirements: l.requirements,
          targetAudience: l.targetAudience,
          duration: l.duration || 30,
          videoUrl: l.videoUrl,
          imageUrl: l.imageUrl,
        })));
        setQuizzes(quizzesData);
        setProgress(progressData.map(p => ({
          lessonId: p.lessonId,
          completed: p.completed,
        })));
        
        // Auto-select the lesson from URL param, or fall back to first lesson
        if (lessonsData.length > 0 && !selectedLesson) {
          const targetLesson = lessonIdParam
            ? (lessonsData.find(l => l.id === lessonIdParam) || lessonsData[0])
            : lessonsData[0];
          setSelectedLesson({
            id: targetLesson.id,
            title: targetLesson.title,
            description: targetLesson.description,
            content: targetLesson.content || '',
            duration: targetLesson.duration || 30,
            videoUrl: targetLesson.videoUrl,
            imageUrl: targetLesson.imageUrl,
          });
          // Record lesson access immediately (Udemy-style progress tracking)
          if (user?.id && targetLesson.id) {
            upsertProgress({
              userId: user.id,
              lessonId: targetLesson.id,
              completed: false,
              lastAccessedAt: new Date(),
            }).catch(() => {});
          }
          try {
            const firstLessonQuiz = await getQuizByLessonId(targetLesson.id);
            if (firstLessonQuiz && firstLessonQuiz.questions && firstLessonQuiz.questions.length > 0) {
              setQuizTitle(firstLessonQuiz.title || "Lesson Quiz");
              const mapped = firstLessonQuiz.questions.map((q: any, idx: number) => ({
                id: q.id || String(idx + 1),
                question: q.question,
                options: q.options,
                correct_answer: q.options[q.correctAnswer] ?? '',
                explanation: q.explanation || null,
                order_number: idx + 1,
              }));
              setSelectedQuiz(firstLessonQuiz);
              setQuizQuestions(mapped);
            }
          } catch {/* no quiz for first lesson */}
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError("Failed to load course content. Please check your connection and try again.");
      } finally {
        setLoadingData(false);
        setCheckingAccess(false);
      }
    };

    fetchLessonsAndProgress();
  }, [user, gradeParam, subjectName, termParam]);

  // Fetch reviews and stats
  useEffect(() => {
    const fetchReviews = async () => {
      if (!subjectName || !gradeParam) return;
      
      setLoadingReviews(true);
      try {
        const [reviewsData, statsData] = await Promise.all([
          getCourseReviews(subjectName, gradeParam, termParam || undefined),
          getReviewStats(subjectName, gradeParam, termParam || undefined)
        ]);
        setReviews(reviewsData);
        setReviewStats(statsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [subjectName, gradeParam, termParam]);

  // Fetch Q&A questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!subjectName || !gradeParam) return;
      
      setLoadingQuestions(true);
      try {
        const questionsData = await getCourseQuestions(subjectName, gradeParam, termParam || undefined);
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [subjectName, gradeParam, termParam]);

  // Review handlers
  const handleSubmitReview = async () => {
    if (!user || !subjectName || !gradeParam) return;
    
    setSubmittingReview(true);
    try {
      await createCourseReview({
        subject: subjectName,
        grade: gradeParam,
        term: termParam || undefined,
        rating: newReviewRating,
        review: newReviewText
      });
      
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback."
      });
      
      // Refresh reviews
      const [reviewsData, statsData] = await Promise.all([
        getCourseReviews(subjectName, gradeParam, termParam || undefined),
        getReviewStats(subjectName, gradeParam, termParam || undefined)
      ]);
      setReviews(reviewsData);
      setReviewStats(statsData);
      
      setReviewDialogOpen(false);
      setNewReviewRating(5);
      setNewReviewText("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      await markReviewHelpful(reviewId, helpful);
      
      // Update local state
      setReviews(reviews.map(r => 
        r._id === reviewId 
          ? { 
              ...r, 
              helpful: helpful ? r.helpful + 1 : r.helpful,
              notHelpful: !helpful ? r.notHelpful + 1 : r.notHelpful
            }
          : r
      ));
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  // Q&A handlers
  const handleSubmitQuestion = async () => {
    if (!user || !subjectName || !gradeParam) return;
    
    setSubmittingQuestion(true);
    try {
      await createCourseQuestion({
        subject: subjectName,
        grade: gradeParam,
        term: termParam || undefined,
        lessonId: selectedLesson?.id,
        question: newQuestionText
      });
      
      toast({
        title: "Question posted!",
        description: "You'll be notified when someone answers."
      });
      
      // Refresh questions
      const questionsData = await getCourseQuestions(subjectName, gradeParam, termParam || undefined);
      setQuestions(questionsData);
      
      setQuestionDialogOpen(false);
      setNewQuestionText("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to post question",
        variant: "destructive"
      });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!user || !answerText[questionId]) return;
    
    setSubmittingAnswer(questionId);
    try {
      await addCourseAnswer(questionId, answerText[questionId]);
      
      toast({
        title: "Answer posted!",
        description: "Thank you for helping out."
      });
      
      // Refresh questions
      const questionsData = await getCourseQuestions(subjectName!, gradeParam!, termParam || undefined);
      setQuestions(questionsData);
      
      setAnswerText({ ...answerText, [questionId]: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to post answer",
        variant: "destructive"
      });
    } finally {
      setSubmittingAnswer(null);
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    try {
      await upvoteQuestion(questionId);
      setQuestions(questions.map(q => 
        q._id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
      ));
    } catch (error) {
      console.error('Error upvoting question:', error);
    }
  };

  const handleUpvoteAnswer = async (questionId: string, answerId: string) => {
    try {
      await upvoteAnswer(questionId, answerId);
      setQuestions(questions.map(q => 
        q._id === questionId 
          ? {
              ...q,
              answers: q.answers.map((a: any) =>
                a._id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a
              )
            }
          : q
      ));
    } catch (error) {
      console.error('Error upvoting answer:', error);
    }
  };

  // Video progress tracking
  const [videoResumePos, setVideoResumePos] = useState<number>(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const videoProgressSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestVideoPositionRef = useRef<number>(0);
  const latestWatchPercentRef = useRef<number>(0);

  const LS_VIDEO_KEY = (id: string) => `mindsta_video_pos_${id}`;

  const handleVideoTimeUpdate = (seconds: number) => {
    latestVideoPositionRef.current = seconds;
    // Debounce backend saves — save to backend at most every 30 seconds
    if (!videoProgressSaveRef.current && selectedLesson?.id && user) {
      videoProgressSaveRef.current = setTimeout(() => {
        videoProgressSaveRef.current = null;
        upsertProgress({
          userId: user.id,
          lessonId: selectedLesson.id,
          completed: false,
          videoPosition: Math.floor(latestVideoPositionRef.current),
          videoWatchPercent: latestWatchPercentRef.current,
          lastAccessedAt: new Date(),
        }).catch(() => {});
      }, 30_000);
    }
  };

  const handleVideoProgress = (percent: number) => {
    latestWatchPercentRef.current = percent;
    // Also save to localStorage immediately for quick resume
    if (selectedLesson?.id) {
      localStorage.setItem(LS_VIDEO_KEY(selectedLesson.id), String(Math.floor(latestVideoPositionRef.current)));
    }
  };

  const handleVideoEnded = () => {
    if (selectedLesson?.id) {
      localStorage.removeItem(LS_VIDEO_KEY(selectedLesson.id));
    }
    // Cancel any pending debounced save — we're doing a full save now
    if (videoProgressSaveRef.current) {
      clearTimeout(videoProgressSaveRef.current);
      videoProgressSaveRef.current = null;
    }
    latestWatchPercentRef.current = 100;

    // Auto-complete if no quiz (Udemy-style: video finish = lesson done)
    const hasQuiz = quizQuestions.length > 0;
    const autoComplete = !hasQuiz;

    if (selectedLesson?.id && user) {
      upsertProgress({
        userId: user.id,
        lessonId: selectedLesson.id,
        completed: autoComplete,
        videoPosition: 0,
        videoWatchPercent: 100,
        lastAccessedAt: new Date(),
      }).then(async () => {
        // Refresh progress so the sidebar checkmarks update immediately
        if (user?.id) {
          const updated = await getUserProgress(user.id);
          setProgress(updated.map((p: any) => ({ lessonId: p.lessonId, completed: p.completed || false })));
        }
      }).catch(() => {});
    }

    toast({
      title: autoComplete ? "Lesson Complete! 🎉" : "Video Complete! 🎬",
      description: autoComplete
        ? "Great job! Lesson marked as complete — keep going!"
        : "Great job! Head to the Quiz tab to test your knowledge and complete this lesson.",
    });
  };

  // Load resume position when selected lesson changes
  useEffect(() => {
    if (!selectedLesson?.id) return;
    // Clear any pending debounced save for the previous lesson
    if (videoProgressSaveRef.current) {
      clearTimeout(videoProgressSaveRef.current);
      videoProgressSaveRef.current = null;
    }
    latestVideoPositionRef.current = 0;
    latestWatchPercentRef.current = 0;

    const saved = Number(localStorage.getItem(LS_VIDEO_KEY(selectedLesson.id)) || '0');
    if (saved > 30) {
      setVideoResumePos(saved);
      setShowResumeBanner(true);
    } else {
      setVideoResumePos(0);
      setShowResumeBanner(false);
    }
  }, [selectedLesson?.id]);

  // Flush video position on unmount
  useEffect(() => {
    return () => {
      if (videoProgressSaveRef.current) clearTimeout(videoProgressSaveRef.current);
      if (selectedLesson?.id && user && latestVideoPositionRef.current > 5) {
        upsertProgress({
          userId: user.id,
          lessonId: selectedLesson.id,
          completed: false,
          videoPosition: Math.floor(latestVideoPositionRef.current),
          videoWatchPercent: latestWatchPercentRef.current,
          lastAccessedAt: new Date(),
        }).catch(() => {});
      }
    };
  }, [selectedLesson?.id, user]);

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  // Start a quiz by ID — fetches full quiz (with questions) from the API
  const handleStartQuiz = async (quizId: string) => {
    setLoadingQuiz(true);
    try {
      const fullQuiz = await getQuizById(quizId);
      if (fullQuiz && fullQuiz.questions && fullQuiz.questions.length > 0) {
        const mapped = fullQuiz.questions.map((q: any, idx: number) => ({
          id: q.id || String(idx + 1),
          question: q.question,
          options: q.options,
          correct_answer: q.options[q.correctAnswer] ?? '',
          explanation: q.explanation || null,
          order_number: idx + 1,
        }));
        setSelectedQuiz(fullQuiz);
        setQuizQuestions(mapped);
        setQuizTitle(fullQuiz.title);
        setCurrentTab('quiz');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast({
          title: 'Quiz unavailable',
          description: 'This quiz has no questions yet.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleLessonClick = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentTab("content");
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Record lesson access immediately (Udemy-style: progress tracked the moment a student opens a lesson)
    if (lesson.id && user?.id) {
      upsertProgress({
        userId: user.id,
        lessonId: lesson.id,
        completed: false,
        lastAccessedAt: new Date(),
      }).catch(() => {});
    }

    // Fetch quiz for the selected lesson
    if (lesson.id) {
      setLoadingQuiz(true);
      try {
        const quizData = await getQuizByLessonId(lesson.id);
        if (quizData && quizData.questions && quizData.questions.length > 0) {
          setQuizTitle(quizData.title || "Lesson Quiz");
          const mapped = quizData.questions.map((q: any, idx: number) => ({
            id: q.id || String(idx + 1),
            question: q.question,
            options: q.options,
            correct_answer: q.options[q.correctAnswer] ?? '',
            explanation: q.explanation || null,
            order_number: idx + 1,
          }));
          setSelectedQuiz(quizData);
          setQuizQuestions(mapped);
        } else {
          // No lesson-specific quiz — reset so the quiz list shows on the quiz tab
          setSelectedQuiz(null);
          setQuizQuestions([]);
          setQuizTitle("");
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setSelectedQuiz(null);
        setQuizQuestions([]);
        setQuizTitle("");
      } finally {
        setLoadingQuiz(false);
      }
    }
  };

  const handleQuizComplete = async (score: number) => {
    if (!user || !selectedLesson?.id) return;

    try {
      await upsertProgress({
        userId: user.id,
        lessonId: selectedLesson.id,
        completed: score >= 80,
        quizScore: score,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      });

      toast({
        title: score >= 80 ? "🎉 Amazing Job!" : "Keep Trying!",
        description:
          score >= 80
            ? "You're a superstar! Quiz complete! 🏆"
            : "Review the answers and try again until you hit 80% or above.",
      });

      // Unlock the Mark Complete button for this lesson once quiz is passed
      if (score >= 80 && selectedLesson?.id) {
        setQuizPassedLessonIds(prev => new Set([...prev, selectedLesson.id]));
      }

      // Refresh progress
      if (user) {
        const userProgress = await getUserProgress(user.id);
        const progressMap = userProgress.map((p: any) => ({
          lessonId: p.lessonId,
          completed: p.completed || false,
        }));
        setProgress(progressMap);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  if (loading || loadingData || checkingAccess) {
    return (
      <div className="min-h-screen bg-background">
        <StudentHeader studentName={studentName} />
        <div className="pt-24 container mx-auto px-4 flex items-center justify-center" style={{minHeight: 'calc(100vh - 96px)'}}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <StudentHeader studentName={studentName} />
        <div className="pt-24 container mx-auto px-4 flex items-center justify-center" style={{minHeight: 'calc(100vh - 96px)'}}>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">&#9888;&#65039;</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{fetchError}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/browse')}>Browse lessonss</Button>
              <Button onClick={() => { setFetchError(null); setLoadingData(true); window.location.reload(); }}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
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
              <div className="bg-muted rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-1">{subjectName}</h3>
                <p className="text-sm text-muted-foreground">
                  Grade {gradeParam}{termParam ? ` • ${termParam.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}` : ''}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/browse')} variant="outline">
                  Browse lessonss
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

  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 30), 0);

  // When navigated from a specific lesson card (lessonId in URL), only show that lesson in the sidebar
  const sidebarLessons = (() => {
    if (!lessonIdParam) return lessons;
    const filtered = lessons.filter(l => l.id === lessonIdParam);
    return filtered.length > 0 ? filtered : lessons;
  })();

  // All stats are scoped to sidebarLessons so that when a specific lesson is selected
  // counts reflect only the purchased lesson, not the entire subject.
  const sidebarLessonIds = new Set(sidebarLessons.map(l => l.id));
  const completedCount = sidebarLessons.filter(l => isLessonCompleted(l.id)).length;
  const progressPercent = sidebarLessons.length > 0 ? Math.round((completedCount / sidebarLessons.length) * 100) : 0;

  // Duration to display in sidebar header — matches what sidebarLessons shows
  const sidebarDuration = sidebarLessons.reduce((sum, l) => sum + (l.duration || 30), 0);

  // Quiz count scoped to whichever lessons are shown in the sidebar.
  // When a specific lesson is selected via lessonIdParam, use the already-loaded selectedQuiz
  // (fetched via getQuizByLessonId which is a direct lookup and more reliable than the
  // filter-based getQuizzesByFilters which can miss quizzes with mismatched metadata).
  const sidebarQuizCount = lessonIdParam
    ? (selectedQuiz !== null ? 1 : 0)
    : quizzes.filter(q => sidebarLessonIds.has(q.lessonId)).length;

  // Duration shown in stats / header — per selected lesson when navigating from a card,
  // otherwise the full course total
  const displayDuration = lessonIdParam && selectedLesson
    ? (selectedLesson.duration || 30)
    : totalDuration;

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader studentName={studentName} />

      {/* Top Navigation Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/browse')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="border-l pl-4 hidden md:block">
              <h2 className="font-semibold text-sm">{subjectName}</h2>
              <p className="text-xs text-muted-foreground">
                {progressPercent}% complete
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md">
              <Award className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">{completedCount}/{sidebarLessons.length} Completed</span>
            </div>
            {/* Mobile lesson list button */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden gap-1.5 border-purple-300 text-purple-700 dark:text-purple-300"
              onClick={() => setMobileLessonsOpen(true)}
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-semibold">{completedCount}/{sidebarLessons.length}</span>
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1" />
      </div>

      <main className="pt-[120px] pb-8">
        <div className="flex">
          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-0 lg:mr-96' : 'mr-0'}`}>
            <div className="max-w-full">
              {/* Video Player Section - Always at Top */}
              {selectedLesson ? (
                <div className="mb-6">
                  <div className="container mx-auto px-4 max-w-5xl">
                    {selectedLesson.videoUrl ? (
                      <>
                        {showResumeBanner && videoResumePos > 30 && (
                          <div className="mb-3 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-sm">
                            <span className="text-foreground font-medium">
                              ▶ Resume from {Math.floor(videoResumePos / 60)}:{String(Math.floor(videoResumePos % 60)).padStart(2, '0')}
                            </span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setShowResumeBanner(false)}>
                                Resume
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setVideoResumePos(0); setShowResumeBanner(false); }}>
                                Start Over
                              </Button>
                            </div>
                          </div>
                        )}
                        <VideoPlayer
                          videoUrl={selectedLesson.videoUrl}
                          title={selectedLesson.title}
                          lessonId={selectedLesson.id}
                          enableDownload={false}
                          startAt={showResumeBanner ? videoResumePos : 0}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onProgress={handleVideoProgress}
                          onEnded={handleVideoEnded}
                        />
                      </>
                    ) : (
                      <Card className="overflow-hidden">
                        <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-blue-900">
                          {selectedLesson.imageUrl && (
                            <img
                              src={selectedLesson.imageUrl}
                              alt={selectedLesson.title}
                              className="absolute inset-0 w-full h-full opacity-50"
                              style={{ objectFit: (selectedLesson.imageObjectFit as any) || 'cover' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <PlayCircle className="w-20 h-20 text-white/80 mx-auto mb-4" />
                              <p className="text-white/90 text-lg font-medium">Video Coming Soon</p>
                              <p className="text-white/60 text-sm mt-2">This lesson's video will be available shortly</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Lesson Title and Actions */}
                  <div className="container mx-auto px-4 max-w-5xl mt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold mb-2">{selectedLesson.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{selectedLesson.duration != null ? `${selectedLesson.duration} min` : 'Duration not set'}</span>
                          </div>
                          {isLessonCompleted(selectedLesson.id) && (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            if (!selectedLesson?.id || !user?.id || isLessonCompleted(selectedLesson.id)) return;
                            if (quizQuestions.length > 0 && !quizPassedLessonIds.has(selectedLesson.id)) return;
                            try {
                              await upsertProgress({
                                userId: user.id,
                                lessonId: selectedLesson.id,
                                completed: true,
                                lastAccessedAt: new Date(),
                                completedAt: new Date(),
                              });
                              const updated = await getUserProgress(user.id);
                              setProgress(updated.map((p: any) => ({ lessonId: p.lessonId, completed: p.completed || false })));
                              toast({ title: "Lesson completed! 🎉", description: "Great work — keep it up!" });
                            } catch {
                              toast({ title: "Could not save progress", variant: "destructive" });
                            }
                          }}
                          variant={isLessonCompleted(selectedLesson.id) ? "outline" : "default"}
                          className="gap-2"
                          disabled={
                            isLessonCompleted(selectedLesson.id) ||
                            (quizQuestions.length > 0 && !quizPassedLessonIds.has(selectedLesson.id))
                          }
                          title={
                            quizQuestions.length > 0 && !isLessonCompleted(selectedLesson.id) && !quizPassedLessonIds.has(selectedLesson.id)
                              ? "Complete the quiz to unlock this lesson"
                              : undefined
                          }
                        >
                          <CheckCircle className="w-4 h-4" />
                          {isLessonCompleted(selectedLesson.id)
                            ? 'Completed'
                            : quizQuestions.length > 0 && !quizPassedLessonIds.has(selectedLesson.id)
                            ? 'Quiz Required'
                            : 'Complete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-orange-950/20 p-8 border-b">
                    <div className="container mx-auto px-4 max-w-5xl">
                      <h1 className="text-4xl font-bold mb-3">{subjectName}</h1>
                      <p className="text-muted-foreground mb-6">
                        {grade === "Common Entrance" ? "Common Entrance" : `Grade ${gradeParam}`}
                        {termParam ? ` • ${termParam.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}` : ''}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">
                            {displayDuration >= 60
                              ? `${Math.floor(displayDuration / 60)}h ${displayDuration % 60}m`
                              : `${displayDuration}m`}
                            {lessonIdParam ? '' : ' total'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded-lg">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{lessons.length} lessons</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded-lg">
                          <Award className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium">{progressPercent}% complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs Section */}
              <div className="container mx-auto px-4 max-w-5xl">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid mb-6">
                  <TabsTrigger value="overview" className="gap-2">
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="gap-2">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Quiz</span>
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="gap-2">
                    <Star className="w-4 h-4" />
                    <span className="hidden sm:inline">Reviews</span>
                  </TabsTrigger>
                  <TabsTrigger value="discussion" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Q&A</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Course</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Show first lesson's overview if available */}
                      {lessons.length > 0 && lessons[0].overview ? (
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-muted-foreground whitespace-pre-wrap">{stripHtml(lessons[0].overview)}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No course description has been added yet.
                        </p>
                      )}
                      
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">What You'll Learn</h4>
                        {lessons.length > 0 && lessons[0].whatYouWillLearn && lessons[0].whatYouWillLearn.length > 0 ? (
                          <ul className="space-y-2">
                            {lessons[0].whatYouWillLearn.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No learning objectives have been added for this course yet.
                          </p>
                        )}
                      </div>

                      {/* Show requirements if available */}
                      {lessons.length > 0 && lessons[0].requirements && lessons[0].requirements.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3">Requirements</h4>
                          <ul className="space-y-2">
                            {lessons[0].requirements.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Show target audience if available */}
                      {lessons.length > 0 && lessons[0].targetAudience && lessons[0].targetAudience.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3">Who This Course Is For</h4>
                          <ul className="space-y-2">
                            {lessons[0].targetAudience.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Course Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{sidebarLessons.length}</div>
                          <div className="text-sm text-muted-foreground">Lessons</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {displayDuration >= 60
                              ? `${Math.floor(displayDuration / 60)}h${displayDuration % 60 > 0 ? ` ${displayDuration % 60}m` : ''}`
                              : `${displayDuration}m`}
                          </div>
                          <div className="text-sm text-muted-foreground">Video Time</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{progressPercent}%</div>
                          <div className="text-sm text-muted-foreground">Progress</div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{completedCount} of {sidebarLessons.length} lessons completed</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content">
                  {selectedLesson ? (
                    <div className="space-y-4">
                      {/* Full lesson content (rich text HTML) */}
                      {selectedLesson.content && selectedLesson.content.trim().length > 10 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Lesson Content</CardTitle>
                          </CardHeader>
                          <CardContent className="overflow-hidden">
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none leading-relaxed break-words [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-all [&_img]:max-w-full [&_*]:max-w-full"
                              dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                            />
                          </CardContent>
                        </Card>
                      ) : null}

                      {/* Brief description — skip if it looks like a plain URL */}
                      {(() => {
                        const raw = stripHtml(selectedLesson.description || '');
                        const isUrl = /^https?:\/\//.test(raw) || /^www\./.test(raw);
                        if (!raw || isUrl) return null;
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-hidden">
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{raw}</p>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* Fallback if neither content nor description is useful */}
                      {!selectedLesson.content && (() => {
                        const raw = stripHtml(selectedLesson.description || '');
                        const isUrl = /^https?:\/\//.test(raw) || /^www\./.test(raw);
                        if (!raw || isUrl) {
                          return (
                            <Card>
                              <CardContent className="py-10 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No written content for this lesson yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">Watch the video above to learn about this topic.</p>
                              </CardContent>
                            </Card>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Select a Lesson</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-2">Choose a lesson from the sidebar to start learning</p>
                          <p className="text-sm text-muted-foreground">Click on any lesson in the Lesson Content panel</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="quiz">
                  {selectedQuiz && quizQuestions.length > 0 ? (
                    <Quiz
                      questions={quizQuestions}
                      quizTitle={quizTitle || "Course Quiz"}
                      onComplete={handleQuizComplete}
                      onBackToTopic={() => setCurrentTab("content")}
                      onBackToSubject={() => navigate("/my-learning")}
                      onBackToClassroom={() => navigate("/dashboard")}
                      lessonTitle={selectedQuiz.title}
                      subject={subjectName}
                      grade={gradeParam}
                      term={termParam ? termParam.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ') : undefined}
                    />
                  ) : loadingQuiz || loadingData ? (
                    <Card>
                      <CardContent className="py-16 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading quizzes...</p>
                      </CardContent>
                    </Card>
                  ) : quizzes.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          Available Quizzes
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available for this subject</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {quizzes.map((quiz, index) => {
                            return (
                              <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-all"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 cursor-pointer" onClick={() => handleStartQuiz(quiz.id)}>
                                    <h4 className="font-semibold text-lg mb-1">{quiz.title}</h4>
                                    {quiz.description && (
                                      <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        <span>{quiz.questionCount || quiz.questions?.length || 0} questions</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Target className="w-4 h-4" />
                                        <span>{quiz.passingScore || 70}% to pass</span>
                                      </div>
                                      {quiz.timeLimit && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          <span>{Math.round(quiz.timeLimit / 60)} minutes</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    className="flex-shrink-0 ml-4"
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    disabled={loadingQuiz}
                                  >
                                    {loadingQuiz ? 'Loading...' : 'Take Quiz'}
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-16 text-center">
                        <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-xl font-bold text-muted-foreground mb-2">No quizzes available</p>
                        <p className="text-muted-foreground">This course doesn't have any quizzes yet.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="reviews">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Student Reviews</CardTitle>
                        {reviewStats && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center">
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              <span className="ml-1 font-bold">{reviewStats.averageRating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                        )}
                      </div>
                      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>Write a Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Rating</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-8 h-8 cursor-pointer transition-colors ${
                                      star <= newReviewRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                    onClick={() => setNewReviewRating(star)}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Your Review</label>
                              <Textarea
                                placeholder="Share your experience with this course..."
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <Button 
                              onClick={handleSubmitReview} 
                              disabled={submittingReview || !newReviewText.trim()}
                              className="w-full"
                            >
                              {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {loadingReviews ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground font-medium">No reviews yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Be the first to review this course!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review._id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">{review.studentName || review.userName || 'Student'}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                      />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {review.review && (
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.review}</p>
                              )}
                              <div className="flex gap-3 mt-3 pt-3 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 h-7 text-xs"
                                  onClick={() => handleMarkHelpful(review._id, true)}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  Helpful ({review.helpful || 0})
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 h-7 text-xs"
                                  onClick={() => handleMarkHelpful(review._id, false)}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                  Not Helpful ({review.notHelpful || 0})
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="discussion" className="space-y-6">
                  {/* Ask a Question */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Ask a Question
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="What would you like to know about this course?"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={handleSubmitQuestion}
                        disabled={submittingQuestion || !newQuestionText.trim()}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {submittingQuestion ? 'Posting...' : 'Post Question'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Questions List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Questions {questions.length > 0 && `(${questions.length})`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingQuestions ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        </div>
                      ) : questions.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground font-medium">No questions yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Ask a question to get help from instructors and peers
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {questions.map((question) => (
                            <div key={question._id} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-col h-auto p-2"
                                  onClick={() => handleUpvoteQuestion(question._id)}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  <span className="text-xs mt-1">{question.upvotes}</span>
                                </Button>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-medium">{question.question}</h4>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span>{question.studentName}</span>
                                        <span>•</span>
                                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                                        {question.lessonTitle && (
                                          <>
                                            <span>•</span>
                                            <span>{question.lessonTitle}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <Badge variant={question.status === 'answered' ? 'default' : 'secondary'}>
                                      {question.status}
                                    </Badge>
                                  </div>

                                  {/* Answers */}
                                  {question.answers && question.answers.length > 0 && (
                                    <div className="mt-4 space-y-3 pl-4 border-l-2">
                                      {question.answers.map((answer: any) => (
                                        <div key={answer._id} className="bg-muted/50 rounded-lg p-3">
                                          <div className="flex items-start gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="flex-col h-auto p-1"
                                              onClick={() => handleUpvoteAnswer(question._id, answer._id)}
                                            >
                                              <ThumbsUp className="w-3 h-3" />
                                              <span className="text-xs">{answer.upvotes}</span>
                                            </Button>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">{answer.userName}</span>
                                                {answer.isInstructor && (
                                                  <Badge variant="default" className="text-xs">Instructor</Badge>
                                                )}
                                                {answer.isAccepted && (
                                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                )}
                                              </div>
                                              <p className="text-sm">{answer.answer}</p>
                                              <span className="text-xs text-muted-foreground">
                                                {new Date(answer.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Answer Form */}
                                  <div className="mt-4">
                                    <div className="flex gap-2">
                                      <Textarea
                                        placeholder="Write your answer..."
                                        value={answerText[question._id] || ''}
                                        onChange={(e) => setAnswerText({ ...answerText, [question._id]: e.target.value })}
                                        rows={2}
                                        className="flex-1"
                                      />
                                      <Button
                                        onClick={() => handleSubmitAnswer(question._id)}
                                        disabled={submittingAnswer === question._id || !answerText[question._id]?.trim()}
                                        size="sm"
                                      >
                                        <Send className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              </div>
            </div>
          </div>

          {/* Sidebar - Course Curriculum */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: 384 }}
                animate={{ x: 0 }}
                exit={{ x: 384 }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed top-[120px] right-0 bottom-0 w-96 bg-background border-l shadow-lg z-30 hidden lg:block"
              >
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-1">Lesson Content</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {sidebarLessons.length} lesson{sidebarLessons.length !== 1 ? 's' : ''} • {sidebarQuizCount} quiz{sidebarQuizCount !== 1 ? 'zes' : ''} • {sidebarDuration >= 60 ? `${Math.floor(sidebarDuration / 60)}h ${sidebarDuration % 60}m` : `${sidebarDuration}m`}
                    </p>
                    <div className="space-y-4">
                      {/* Lessons Section */}
                      {sidebarLessons.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Lessons ({sidebarLessons.length})
                          </h4>
                          <div className="space-y-2">
                            {sidebarLessons.map((lesson, index) => {
                              const completed = isLessonCompleted(lesson.id);
                              return (
                                <div
                                  key={lesson.id}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedLesson?.id === lesson.id
                                      ? 'bg-primary/10 border-primary'
                                      : completed
                                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => handleLessonClick(lesson)}
                                >
                                  <div className="flex items-start gap-2">
                                    {lesson.imageUrl ? (
                                      <div className="flex-shrink-0 relative w-10 h-10 rounded-lg overflow-hidden mt-0.5">
                                        <img
                                          src={lesson.imageUrl}
                                          alt={lesson.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        {completed && (
                                          <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${completed ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm leading-tight mb-1">
                                        {lesson.title}
                                      </h4>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{lesson.duration} min</span>
                                        {completed && (
                                          <>
                                            <span>•</span>
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            <span className="text-green-600">Completed</span>
                                          </>
                                        )}
                                        {!completed && Number(localStorage.getItem(LS_VIDEO_KEY(lesson.id)) || '0') > 30 && (
                                          <>
                                            <span>•</span>
                                            <span className="text-blue-500">In progress</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Lesson Drawer */}
      <Sheet open={mobileLessonsOpen} onOpenChange={setMobileLessonsOpen}>
        <SheetContent side="bottom" className="h-[75vh] px-0 pb-0 rounded-t-2xl">
          <SheetHeader className="px-5 pt-5 pb-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Lessons
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {sidebarLessons.length} lesson{sidebarLessons.length !== 1 ? 's' : ''} • {sidebarQuizCount} quiz{sidebarQuizCount !== 1 ? 'zes' : ''} • {sidebarDuration >= 60 ? `${Math.floor(sidebarDuration / 60)}h ${sidebarDuration % 60}m` : `${sidebarDuration}m`}
            </p>
            {/* Mini progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedCount} of {sidebarLessons.length} completed</span>
                <span className="font-semibold text-purple-600">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2 pb-10">
              {sidebarLessons.map((lesson, index) => {
                const completed = isLessonCompleted(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-400'
                        : completed
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => {
                      handleLessonClick(lesson);
                      setMobileLessonsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {lesson.imageUrl ? (
                        <div className="flex-shrink-0 relative w-14 h-10 rounded-lg overflow-hidden">
                          <img
                            src={lesson.imageUrl}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          {completed && (
                            <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${completed ? 'bg-green-600 text-white' : selectedLesson?.id === lesson.id ? 'bg-purple-600 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                          {completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm leading-tight truncate ${
                          selectedLesson?.id === lesson.id ? 'text-purple-700 dark:text-purple-300' : ''
                        }`}>
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.duration} min</span>
                          {completed && <span className="text-green-600 font-medium">• Completed</span>}
                          {!completed && Number(localStorage.getItem(LS_VIDEO_KEY(lesson.id)) || '0') > 30 && (
                            <span className="text-blue-500 font-medium">• In progress</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                        selectedLesson?.id === lesson.id ? 'text-purple-600' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SubjectLessonsPage;
