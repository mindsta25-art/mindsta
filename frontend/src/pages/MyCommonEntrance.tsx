import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCommonExams, getCommonExamById, submitCommonExam, type CommonExam } from "@/api/commonEntrance";
import { getEnrollments } from "@/api/enrollments";
import { Progress } from "@/components/ui/progress";

import { GraduationCap, Clock, Star, CheckCircle2, XCircle, Trophy, BookOpen, ArrowLeft, Search } from "lucide-react";

type ExamQuestion = {
  id: string;
  question: string;
  imageUrl?: string | null;
  options: string[];
};

type View = "list" | "intro" | "taking" | "result";

const MyCommonEntrance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deepLinkExamId = searchParams.get('examId');
  const autoStartedRef = useRef(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [enrolledExams, setEnrolledExams] = useState<CommonExam[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>("list");
  const [selectedExam, setSelectedExam] = useState<CommonExam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{
    score: number; passed: boolean; correct: number; total: number;
    results: Array<{ questionId: string; selected: number; correctAnswer: number; isCorrect: boolean; explanation: string }>;
  } | null>(null);
  const [loadingExam, setLoadingExam] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [enrollments, allExams] = await Promise.all([getEnrollments(), getCommonExams()]);
        const enrolledIds = enrollments
          .filter(e => e.isActive && e.commonEntranceId)
          .map(e => e.commonEntranceId!);
        const purchased = allExams.filter(exam => enrolledIds.includes(exam.id));
        setEnrolledExams(purchased);

        // Deep-link: auto-open a specific exam if examId is in the URL
        if (deepLinkExamId && !autoStartedRef.current) {
          const target = purchased.find(e => e.id === deepLinkExamId);
          if (target) {
            autoStartedRef.current = true;
            // handleStartExam is defined below; defer to next tick so state is settled
            setTimeout(() => handleStartExam(target), 0);
          }
        }
      } catch {
        toast({ title: "Error", description: "Failed to load your exams.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, deepLinkExamId]);

  // Countdown timer
  useEffect(() => {
    if (view !== "taking") return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [view, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStartExam = async (exam: CommonExam) => {
    setLoadingExam(exam.id);
    try {
      const full = await getCommonExamById(exam.id);
      if (!full || !full.questions) throw new Error("Could not load exam questions.");
      setSelectedExam(full);
      setQuestions(full.questions as ExamQuestion[]);
      setAnswers(new Array(full.questions.length).fill(-1));
      setCurrentQ(0);
      setView("intro");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load exam.", variant: "destructive" });
    } finally {
      setLoadingExam(null);
    }
  };

  const beginExam = () => {
    setConfirmOpen(false);
    setTimeLeft(selectedExam!.timeLimit);
    setView("taking");
  };

  const handleAnswer = (optionIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = optionIdx;
      return next;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!selectedExam) return;
    if (!autoSubmit && answers.some((a) => a === -1)) {
      const unanswered = answers.filter((a) => a === -1).length;
      toast({ title: "Unanswered Questions", description: `You have ${unanswered} unanswered question(s). Are you sure?`, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await submitCommonExam(selectedExam.id, answers.map((a) => (a === -1 ? 0 : a)));
      setResult(res);
      setView("result");
    } catch {
      toast({ title: "Error", description: "Failed to submit exam.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StudentHeader />
        <main className="flex-1 container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/my-learning")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Learning
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">My Common Entrance Exams</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Your purchased Common Entrance practice exams</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="h-56 pt-6" /></Card>
              ))}
            </div>
          ) : enrolledExams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No purchased exams yet</h3>
                <p className="text-muted-foreground mt-1 mb-6">Browse available Common Entrance exams to get started</p>
                <Button onClick={() => navigate("/common-entrance")}>
                  Browse Exams
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                You have access to <span className="font-semibold text-foreground">{enrolledExams.length}</span> exam{enrolledExams.length !== 1 ? "s" : ""}. Select one to begin.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enrolledExams.map((exam) => (
                  <Card key={exam.id} className="flex flex-col hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => handleStartExam(exam)}>
                    {exam.imageUrl ? (
                      <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
                        <img
                          src={exam.imageUrl}
                          alt={exam.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-t-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-white opacity-80" />
                      </div>
                    )}
                    <CardHeader className="pb-2 flex-1">
                      <CardTitle className="text-base leading-snug">{exam.title}</CardTitle>
                      {(exam.subtitle || exam.description) && (
                        <CardDescription className="line-clamp-2 text-sm">{exam.subtitle || exam.description}</CardDescription>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge className="text-xs">{exam.subject}</Badge>
                        <Badge variant="outline" className="text-xs gap-1">
                          <BookOpen className="w-3 h-3" /> {exam.questionCount} Qs
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="w-3 h-3" /> {Math.round(exam.timeLimit / 60)} min
                        </Badge>
                      </div>
                      {exam.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{exam.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({exam.ratingsCount})</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md font-bold"
                        disabled={loadingExam === exam.id}
                        onClick={(e) => { e.stopPropagation(); handleStartExam(exam); }}
                      >
                        {loadingExam === exam.id ? "Loading…" : "Start Exam"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t flex justify-center">
                <Button variant="outline" onClick={() => navigate("/common-entrance")}>
                  Browse More Exams
                </Button>
              </div>
            </>
          )}
        </main>
        <StudentFooter />
      </div>
    );
  }

  // ── INTRO VIEW ─────────────────────────────────────────────────────────────
  if (view === "intro" && selectedExam) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StudentHeader />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-3">
              {selectedExam.imageUrl ? (
                <img src={selectedExam.imageUrl} alt={selectedExam.title} className="w-full h-44 object-cover rounded-lg mb-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-32 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              )}
              <Badge className="mx-auto">{selectedExam.subject}</Badge>
              <CardTitle className="text-2xl font-black">{selectedExam.title}</CardTitle>
              {selectedExam.description && <CardDescription className="text-base">{selectedExam.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedExam.overview && (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedExam.overview }}
                />
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50 dark:bg-purple-950 text-center">
                  <div className="text-sm text-muted-foreground">Questions</div>
                  <div className="text-2xl font-black">50</div>
                </div>
                <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 text-center">
                  <div className="text-sm text-muted-foreground">Time Limit</div>
                  <div className="text-2xl font-black">{Math.round(selectedExam.timeLimit / 60)} min</div>
                </div>
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-950 text-center">
                  <div className="text-sm text-muted-foreground">Pass Mark</div>
                  <div className="text-2xl font-black">{selectedExam.passingScore}%</div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-muted p-4 bg-muted/30">
                <div className="font-bold mb-2">Before you start</div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>You have {Math.round(selectedExam.timeLimit / 60)} minutes to complete all 50 questions.</li>
                  <li>You can navigate between questions freely.</li>
                  <li>Answers are not shown until you submit.</li>
                  <li>Explanations are revealed after submission.</li>
                  <li>Score {selectedExam.passingScore}% or above to pass.</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="flex-1" onClick={() => setConfirmOpen(true)}>
                  Start Exam
                </Button>
                <Button size="lg" variant="outline" onClick={() => setView("list")}>
                  Back to My Exams
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <StudentFooter />

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ready to start?</DialogTitle>
              <DialogDescription>
                The timer starts immediately. You have {Math.round(selectedExam.timeLimit / 60)} minutes to answer 50 questions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Not now</Button>
              <Button onClick={beginExam}>Start Now</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── TAKING VIEW ────────────────────────────────────────────────────────────
  if (view === "taking" && selectedExam && questions.length > 0) {
    const q = questions[currentQ];
    const answeredCount = answers.filter((a) => a !== -1).length;
    const timeProgress = (timeLeft / selectedExam.timeLimit) * 100;
    const isLowTime = timeLeft <= 120;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StudentHeader />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
          {/* Timer bar */}
          <div className={`mb-4 p-3 rounded-lg border-2 ${isLowTime ? "border-red-400 bg-red-50 dark:bg-red-950" : "border-purple-200 bg-purple-50 dark:bg-purple-950"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`flex items-center gap-2 font-bold text-lg ${isLowTime ? "text-red-600 animate-pulse" : "text-purple-700 dark:text-purple-300"}`}>
                <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
              </div>
              <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered</span>
            </div>
            <Progress value={timeProgress} className={isLowTime ? "bg-red-100" : "bg-purple-100"} />
          </div>

          {/* Question navigation dots — 5×10 grid */}
          <div className="mb-4 space-y-1">
            {Array.from({ length: 5 }, (_, rowIdx) => (
              <div key={rowIdx} className="flex gap-1">
                {Array.from({ length: 10 }, (_, colIdx) => {
                  const i = rowIdx * 10 + colIdx;
                  const answered = answers[i] !== -1;
                  const isCurr = i === currentQ;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`w-7 h-7 rounded-full border text-[10px] font-medium flex items-center justify-center transition-all ${
                        isCurr
                          ? "border-blue-600 bg-blue-600 text-white ring-2 ring-blue-300"
                          : answered
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-muted-foreground/40 text-foreground hover:border-primary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Question card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="text-xs text-muted-foreground mb-1">Question {currentQ + 1} of {questions.length}</div>
              <CardTitle
                className="text-xl leading-relaxed break-words [&_*]:max-w-full [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: q.question }}
              />
              {q.imageUrl && (
                <img src={q.imageUrl} alt="Question" className="mt-3 max-h-56 rounded-md border object-contain bg-muted" />
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                    answers[currentQ] === idx
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-muted hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              ))}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button variant="outline" onClick={() => setCurrentQ((i) => Math.max(0, i - 1))} disabled={currentQ === 0}>
                  ← Previous
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button onClick={() => setCurrentQ((i) => i + 1)}>Next →</Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Submitting…" : "Submit Exam ✓"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
        <StudentFooter />
      </div>
    );
  }

  // ── RESULT VIEW ────────────────────────────────────────────────────────────
  if (view === "result" && result && selectedExam) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StudentHeader />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl space-y-6">
          {/* Score card */}
          <Card>
            <CardHeader className="text-center">
              {result.passed && (
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
              )}
              <CardTitle className="text-3xl">{result.passed ? "Congratulations! 🎉" : "Keep Practising!"}</CardTitle>
              <CardDescription className="text-xl mt-1">
                You answered {result.correct} of {result.total} correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className={`text-6xl font-black ${result.passed ? "text-green-600" : "text-destructive"}`}>
                {result.score}%
              </div>
              <Badge variant={result.passed ? "default" : "destructive"} className="text-base px-4 py-1">
                {result.passed ? "PASSED" : "NOT PASSED"}
              </Badge>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => { setView("list"); setResult(null); setSelectedExam(null); }}>
                  Back to My Exams
                </Button>
                {!result.passed && (
                  <Button variant="outline" onClick={() => {
                    setAnswers(new Array(questions.length).fill(-1));
                    setCurrentQ(0);
                    setTimeLeft(selectedExam.timeLimit);
                    setResult(null);
                    setView("taking");
                  }}>
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Answers review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Answer Review</CardTitle>
              <CardDescription>See your answers with explanations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.results.map((r, idx) => {
                const q = questions[idx];
                return (
                  <Card key={r.questionId || idx} className={`border-2 ${r.isCorrect ? "border-green-400" : "border-red-400"}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2 mb-3">
                        {r.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div
                          className="font-medium break-words [&_*]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q?.question ?? ""}` }}
                        />
                      </div>
                      <div className="space-y-1 ml-7">
                        {q?.options.map((opt, oi) => {
                          const isCorrectOpt = oi === r.correctAnswer;
                          const isSelectedOpt = oi === r.selected;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                                isCorrectOpt
                                  ? "bg-green-50 dark:bg-green-950 border border-green-300"
                                  : isSelectedOpt && !isCorrectOpt
                                  ? "bg-red-50 dark:bg-red-950 border border-red-300"
                                  : ""
                              }`}
                            >
                              {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                              {isSelectedOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-600" />}
                              {!isCorrectOpt && !isSelectedOpt && <span className="w-4 h-4" />}
                              <span className="font-medium">{String.fromCharCode(65 + oi)}.</span>
                              <span className={isCorrectOpt ? "font-semibold" : ""}>{opt}</span>
                              {isCorrectOpt && <span className="ml-auto text-xs font-semibold text-green-700">✓ Correct</span>}
                              {isSelectedOpt && !isCorrectOpt && <span className="ml-auto text-xs font-semibold text-red-700">✗ Yours</span>}
                            </div>
                          );
                        })}
                      </div>
                      {r.explanation && (
                        <div className="mt-3 ml-7 p-3 text-sm bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200">
                          <span className="font-semibold text-blue-900 dark:text-blue-300">💡 Explanation: </span>
                          <span
                            className="text-blue-800 dark:text-blue-200"
                            dangerouslySetInnerHTML={{ __html: r.explanation }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </main>
        <StudentFooter />
      </div>
    );
  }

  return null;
};

export default MyCommonEntrance;
