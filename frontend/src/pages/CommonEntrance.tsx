import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getCommonExams, getCommonExamById, submitCommonExam, type CommonExam } from "@/api/commonEntrance";
import { type Enrollment } from "@/api/enrollments";
import { api } from "@/lib/apiClient";
import { formatCurrency } from "@/config/siteConfig";
import { Progress } from "@/components/ui/progress";
import { CEPreviewDialog } from "@/components/CEPreviewDialog";

import { GraduationCap, Search, Clock, Star, CheckCircle2, XCircle, Trophy, BookOpen, ShoppingCart, Eye, Heart } from "lucide-react";

type ExamQuestion = {
  id: string;
  question: string;
  imageUrl?: string | null;
  options: string[];
};

type View = "list" | "intro" | "taking" | "result";

const CommonEntrance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addCommonEntranceToCart, isCommonEntranceInCart, refreshCart, loading: cartLoading } = useCart();
  const { isCommonEntranceInWishlist, addCommonEntranceToWishlist, removeCommonEntranceFromWishlist } = useWishlist();
  const [exams, setExams] = useState<CommonExam[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
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
  const [previewExam, setPreviewExam] = useState<CommonExam | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isEnrolledInExam = (examId: string) =>
    // Use .toString() to safely handle both plain string IDs and Mongoose ObjectId objects
    enrollments.some((e) => e.commonEntranceId?.toString() === examId && e.isActive);

  const canAccessExam = (exam: CommonExam) =>
    exam.price === 0 ||
    isEnrolledInExam(exam.id) ||
    // Fallback for enrollments created before commonEntranceId was stored (match by grade+subject)
    enrollments.some(e => e.isActive && e.grade === 'Common Entrance' && e.subject === exam.subject);

  const refreshEnrollments = async () => {
    try {
      // Bypass the 30-second GET cache so post-payment enrollment state is always fresh
      const enrollmentsData = await api.get('/enrollments', undefined, 0) as Enrollment[];
      setEnrollments(enrollmentsData);
    } catch { /* non-fatal */ }
  };

  useEffect(() => {
    Promise.all([
      getCommonExams(),
      // Bypass the 30-second GET cache on initial mount so post-payment enrollment
      // state is always fresh (e.g. when redirected back after checkout).
      api.get('/enrollments', undefined, 0) as Promise<Enrollment[]>,
    ])
      .then(([examsData, enrollmentsData]) => {
        setExams(examsData);
        setEnrollments(enrollmentsData);
        // Also sync the cart so the "In Cart" indicator reflects the latest state
        refreshCart();
      })
      .catch(() => toast({ title: "Error", description: "Failed to load exams.", variant: "destructive" }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh enrollments + cart when the page becomes visible (e.g. after returning from payment)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) { refreshEnrollments(); refreshCart(); } };
    const onFocus = () => { refreshEnrollments(); refreshCart(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start exam when examId is passed via URL (e.g. from My Learning)
  useEffect(() => {
    const examId = searchParams.get('examId');
    if (!examId || exams.length === 0) return;
    const exam = exams.find(e => e.id === examId);
    if (exam) handleStartExam(exam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams]);

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
    if (!canAccessExam(exam)) {
      toast({ title: "Purchase Required", description: "Please purchase this exam to start.", variant: "destructive" });
      return;
    }
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

  const subjectOptions = useMemo(() => {
    const seen = new Set<string>();
    exams.forEach((e) => seen.add(e.subject));
    return Array.from(seen).sort();
  }, [exams]);

  // Cache exam thumbnail so the Wishlist page can display it
  const handleToggleCEWishlist = (exam: CommonExam) => {
    if (isCommonEntranceInWishlist(exam.id)) {
      removeCommonEntranceFromWishlist(exam.id);
    } else {
      if (exam.imageUrl) {
        try {
          localStorage.setItem(
            `wish_img:${encodeURIComponent(exam.title)}:Common Entrance:${encodeURIComponent('ce:' + exam.id)}`,
            exam.imageUrl
          );
        } catch { /* ignore */ }
      }
      addCommonEntranceToWishlist({ id: exam.id, title: exam.title, subject: exam.subject, imageUrl: exam.imageUrl || '' });
    }
  };

  const filtered = exams.filter(
    (e) =>
      (selectedSubject === "all" || e.subject === selectedSubject) &&
      (e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.subject.toLowerCase().includes(search.toLowerCase()))
  );

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <StudentHeader />
        <main className="flex-1 container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-black">Common Entrance Exams</h1>
            </div>
            <p className="text-muted-foreground">Practice with official-style 50-question Common Entrance exams</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exams…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {subjectOptions.length > 0 && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="h-56 pt-6" /></Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{search ? "No exams match your search" : "No exams available yet"}</h3>
                <p className="text-muted-foreground mt-1">Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((exam) => {
                const enrolled = canAccessExam(exam);
                const inCart = isCommonEntranceInCart(exam.id);
                const isFree = exam.price === 0;
                return (
                <Card key={exam.id} className={`flex flex-col hover:shadow-lg transition-all duration-200 group overflow-hidden ${enrolled ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 ring-2 ring-green-200 dark:ring-green-900/50' : ''}`}>
                  {exam.imageUrl ? (
                    <div className="relative w-full h-40 overflow-hidden rounded-t-lg cursor-pointer" onClick={() => enrolled && handleStartExam(exam)}>
                      <img
                        src={exam.imageUrl}
                        alt={exam.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {enrolled && <div className="absolute inset-0 bg-green-600/20" />}
                      {enrolled && (
                        <div className="absolute top-0 right-0 z-20">
                          <div className="bg-green-600 text-white px-4 py-1.5 shadow-lg flex items-center gap-1.5 font-semibold text-xs rounded-bl-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ENROLLED
                          </div>
                        </div>
                      )}
                      {!enrolled && (
                        <button
                          className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center transition-all z-10"
                          onClick={(e) => { e.stopPropagation(); handleToggleCEWishlist(exam); }}
                        >
                          <Heart className={`w-5 h-5 transition-all ${isCommonEntranceInWishlist(exam.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-500'}`} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`relative w-full h-32 rounded-t-lg flex items-center justify-center cursor-pointer ${enrolled ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`} onClick={() => enrolled && handleStartExam(exam)}>
                      <GraduationCap className="w-12 h-12 text-white opacity-80" />
                      {enrolled && (
                        <div className="absolute top-0 right-0 z-20">
                          <div className="bg-green-600 text-white px-4 py-1.5 shadow-lg flex items-center gap-1.5 font-semibold text-xs rounded-bl-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ENROLLED
                          </div>
                        </div>
                      )}
                      {!enrolled && (
                        <button
                          className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center transition-all z-10"
                          onClick={(e) => { e.stopPropagation(); handleToggleCEWishlist(exam); }}
                        >
                          <Heart className={`w-5 h-5 transition-all ${isCommonEntranceInWishlist(exam.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-500'}`} />
                        </button>
                      )}
                    </div>
                  )}
                  <CardHeader className="pb-2 flex-1">
                    <CardTitle className={`text-base leading-snug ${enrolled ? 'text-green-800 dark:text-green-200' : ''}`}>{exam.title}</CardTitle>
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
                    {enrolled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Purchased — you own this exam</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md font-bold" disabled={loadingExam === exam.id} onClick={() => handleStartExam(exam)}>
                              {loadingExam === exam.id ? "Loading…" : "Start Exam"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Begin this exam</TooltipContent>
                        </Tooltip>
                      </div>
                    ) : inCart ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button className="w-full" variant="secondary" onClick={() => navigate("/cart")}>
                            <ShoppingCart className="w-4 h-4 mr-2" /> View Cart
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Go to your cart</TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="pt-1">
                        <div className="flex items-baseline justify-between mb-2">
                          {isFree ? (
                            <span className="text-lg font-extrabold text-green-600 leading-none">FREE</span>
                          ) : (
                            <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{formatCurrency(exam.price)}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-shrink-0 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-300 px-3"
                                onClick={() => { setPreviewExam(exam); setPreviewOpen(true); }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Preview exam details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md font-bold"
                                size="sm"
                                onClick={() => addCommonEntranceToCart(exam.id, exam.title)}
                                disabled={cartLoading}
                              >
                                <ShoppingCart className="w-4 h-4 mr-1.5" />
                                {isFree ? "Enroll Free" : "Add to Cart"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{isFree ? "Enroll for free" : "Add to cart"}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </main>
        <StudentFooter />

        {/* CE Preview Dialog */}
        <CEPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          exam={previewExam}
          isEnrolled={previewExam ? canAccessExam(previewExam) : false}
          isInCart={previewExam ? isCommonEntranceInCart(previewExam.id) : false}
          onAddToCart={() => previewExam && addCommonEntranceToCart(previewExam.id, previewExam.title)}
          onStartExam={() => previewExam && handleStartExam(previewExam)}
        />
      </div>
      </TooltipProvider>
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
                  className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:max-w-full [&_img]:max-w-full overflow-hidden"
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
                  Back to Exams
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
    const isLowTime = timeLeft <= 120;

    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <StudentHeader />
        {/* Sticky exam header */}
        <div className="sticky top-[64px] z-40 bg-white dark:bg-gray-900 border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3">
            {/* Exam title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GraduationCap className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm truncate leading-none">{selectedExam.title}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{selectedExam.subject}</p>
              </div>
            </div>
            {/* Answered count */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{answeredCount}<span className="text-muted-foreground/60">/{questions.length}</span> answered</span>
            </div>
            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-sm flex-shrink-0 ${
              isLowTime
                ? 'bg-red-100 dark:bg-red-950 text-red-600 animate-pulse'
                : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            {/* Submit button */}
            <Button
              size="sm"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
          {/* Answer progress */}
          <Progress value={(answeredCount / questions.length) * 100} className="h-1 rounded-none" />
        </div>

        {/* Main layout */}
        <div className="flex-1 flex max-w-7xl mx-auto w-full gap-4 p-3 sm:p-5">

          {/* Left sidebar: Question navigator (desktop) */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-[128px] bg-white dark:bg-gray-900 rounded-xl border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Questions</p>
              <div className="space-y-1">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-1">
                    {Array.from({ length: 10 }, (_, col) => {
                      const i = row * 10 + col;
                      const answered = answers[i] !== -1;
                      const isCurr = i === currentQ;
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentQ(i)}
                          className={`w-[26px] h-[26px] rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                            isCurr
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                              : answered
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >{i + 1}</button>
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="mt-4 pt-4 border-t space-y-2">
                {[
                  { color: 'bg-blue-600', label: 'Current' },
                  { color: 'bg-green-500', label: 'Answered' },
                  { color: 'bg-gray-200 dark:bg-gray-700', label: 'Not answered' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`w-3.5 h-3.5 rounded flex-shrink-0 ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right: Question area */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Mobile question navigator */}
            <div className="lg:hidden bg-white dark:bg-gray-900 rounded-xl border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigator</span>
                <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</span>
              </div>
              <div className="space-y-1 overflow-x-auto">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-1">
                    {Array.from({ length: 10 }, (_, col) => {
                      const i = row * 10 + col;
                      const answered = answers[i] !== -1;
                      const isCurr = i === currentQ;
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentQ(i)}
                          className={`w-6 h-6 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0 transition-all ${
                            isCurr
                              ? 'bg-blue-600 text-white'
                              : answered
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >{i + 1}</button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-4 sm:px-6 py-3 bg-muted/40 border-b flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Question <span className="text-foreground font-bold">{currentQ + 1}</span> of {questions.length}
                </span>
                <Badge variant="outline" className="text-xs">{selectedExam.subject}</Badge>
              </div>

              {/* Question body */}
              <div className="px-4 sm:px-6 pt-5 pb-4">
                <div
                  className="text-base sm:text-lg font-medium leading-relaxed break-words [&_*]:max-w-full [&_img]:max-w-full mb-6"
                  dangerouslySetInnerHTML={{ __html: q.question }}
                />
                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Question" className="mb-5 max-h-52 rounded-lg border object-contain bg-muted mx-auto block" />
                )}
                {/* Options */}
                <div className="space-y-2.5">
                  {q.options.map((opt, idx) => {
                    const selected = answers[currentQ] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all group ${
                          selected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                          selected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={`flex-1 text-sm sm:text-base break-words min-w-0 ${
                          selected ? 'font-semibold text-blue-900 dark:text-blue-100' : 'text-foreground'
                        }`}>
                          {opt}
                        </span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation footer */}
              <div className="px-4 sm:px-6 py-3 bg-muted/40 border-t flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQ(i => Math.max(0, i - 1))}
                  disabled={currentQ === 0}
                >
                  ← Previous
                </Button>
                <span className="text-xs text-muted-foreground">{currentQ + 1} / {questions.length}</span>
                {currentQ < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentQ(i => i + 1)}>Next →</Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Submitting…' : '✓ Submit Exam'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
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
                  Back to Exams
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
                      <div className="flex items-start gap-2 mb-3 overflow-hidden">
                        {r.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div
                          className="font-medium break-words overflow-hidden flex-1 min-w-0 [&_*]:max-w-full [&_img]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q?.question ?? ""}` }}
                        />
                      </div>
                      <div className="space-y-1 ml-7 overflow-hidden">
                        {q?.options.map((opt, oi) => {
                          const isCorrectOpt = oi === r.correctAnswer;
                          const isSelectedOpt = oi === r.selected;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 min-w-0 ${
                                isCorrectOpt
                                  ? "bg-green-50 dark:bg-green-950 border border-green-300"
                                  : isSelectedOpt && !isCorrectOpt
                                  ? "bg-red-50 dark:bg-red-950 border border-red-300"
                                  : ""
                              }`}
                            >
                              {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                              {isSelectedOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                              {!isCorrectOpt && !isSelectedOpt && <span className="w-4 h-4 flex-shrink-0" />}
                              <span className="font-medium flex-shrink-0">{String.fromCharCode(65 + oi)}.</span>
                              <span className={`flex-1 min-w-0 break-words overflow-hidden ${isCorrectOpt ? "font-semibold" : ""}`}>{opt}</span>
                              {isCorrectOpt && <span className="flex-shrink-0 text-xs font-semibold text-green-700">✓ Correct</span>}
                              {isSelectedOpt && !isCorrectOpt && <span className="flex-shrink-0 text-xs font-semibold text-red-700">✗ Yours</span>}
                            </div>
                          );
                        })}
                      </div>
                      {r.explanation && (
                        <div className="mt-3 ml-7 p-3 text-sm bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 break-words overflow-hidden">
                          <span className="font-semibold text-blue-900 dark:text-blue-300">💡 Explanation: </span>
                          <span
                            className="text-blue-800 dark:text-blue-200 break-words [&_*]:max-w-full [&_img]:max-w-full"
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

export default CommonEntrance;
