import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { getAllLessons, type Lesson } from "@/api/lessons";
import { createQuiz, getQuizById, getQuizByLessonId, updateQuiz, type QuizQuestion } from "@/api/quizzes";
import { ArrowLeft, AlertTriangle, X, Eye, EyeOff, CheckCircle, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const createBlankQuestion = (): QuizQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: -1,
  explanation: "",
});

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterGrade, setFilterGrade] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [form, setForm] = useState({
    lessonId: "",
    title: "",
    description: "",
    passingScore: 70,
    timeLimit: 600,
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([createBlankQuestion()]);
  const [currentQ, setCurrentQ] = useState(0);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQ, setPreviewQ] = useState(0);

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isEditing || !editId || lessons.length === 0) return;
    setIsLoadingQuiz(true);
    getQuizById(editId)
      .then((quiz) => {
        if (!quiz) {
          toast({ title: "Quiz not found", description: "Could not load the selected quiz", variant: "destructive" });
          navigate("/admin/content");
          return;
        }

        const linkedLesson = lessons.find((l) => l.id === quiz.lessonId);
        setForm({
          lessonId: quiz.lessonId || "",
          title: quiz.title || "",
          description: quiz.description || "",
          passingScore: quiz.passingScore || 70,
          timeLimit: quiz.timeLimit || 600,
        });

        if (linkedLesson) {
          setFilterGrade(linkedLesson.grade || "");
          setFilterTerm(linkedLesson.term || "");
          setFilterSubject(linkedLesson.subject || "");
        }

        const loadedQuestions = Array.isArray(quiz.questions) && quiz.questions.length > 0
          ? quiz.questions.map((question) => ({
              question: question.question || "",
              options: Array.isArray(question.options) && question.options.length === 4
                ? question.options
                : ["", "", "", ""],
              correctAnswer: typeof question.correctAnswer === "number" ? question.correctAnswer : -1,
              explanation: question.explanation || "",
            }))
          : [createBlankQuestion()];

        setQuestions(loadedQuestions);
        setCurrentQ(0);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load quiz", variant: "destructive" });
        navigate("/admin/content");
      })
      .finally(() => setIsLoadingQuiz(false));
  }, [isEditing, editId, lessons, toast, navigate]);

  // Check if the selected lesson already has a quiz
  useEffect(() => {
    if (!form.lessonId) {
      setExistingQuizId(null);
      return;
    }
    setCheckingExisting(true);
    getQuizByLessonId(form.lessonId)
      .then(quiz => setExistingQuizId(quiz ? quiz.id : null))
      .catch(() => setExistingQuizId(null))
      .finally(() => setCheckingExisting(false));
  }, [form.lessonId]);

  const isComplete = (q: QuizQuestion) =>
    stripHtml(q.question) !== "" &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((o) => o.trim()) &&
    q.correctAnswer >= 0 &&
    q.correctAnswer < 4 &&
    stripHtml(q.explanation) !== "";

  const completedCount = questions.filter(isComplete).length;

  // Common Entrance lessons require 50 questions; regular lessons require 10
  const selectedLesson = lessons.find((l) => l.id === form.lessonId);
  const isCommonEntrance = selectedLesson?.grade === 'Common Entrance';
  const questionLimit = isCommonEntrance ? 50 : 10;
  const allQuestionsComplete = questions.length === questionLimit && completedCount === questionLimit;
  const hasConflictingExistingQuiz = !!existingQuizId && existingQuizId !== editId;

  const updateQ = (field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[currentQ] = { ...updated[currentQ], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (oIdx: number, value: string) => {
    const updated = [...questions];
    updated[currentQ].options[oIdx] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    if (questions.length >= questionLimit || !isComplete(questions[currentQ])) return;
    const next = [...questions, createBlankQuestion()];
    setQuestions(next);
    setCurrentQ(next.length - 1);
  };

  const removeLastQuestion = () => {
    if (questions.length <= 1) return;
    const updated = questions.slice(0, -1);
    setQuestions(updated);
    setCurrentQ(updated.length - 1);
  };

  // Derive available grades, subjects for dropdowns
  const grades = Array.from(new Set(lessons.map((l) => l.grade))).sort();
  const availableSubjects = Array.from(
    new Set(
      lessons
        .filter((l) => (!filterGrade || l.grade === filterGrade) && (!filterTerm || l.term === filterTerm))
        .map((l) => l.subject)
    )
  );
  const filteredLessons = lessons.filter((l) => {
    return (
      (!filterGrade || l.grade === filterGrade) &&
      (!filterTerm || l.term === filterTerm) &&
      (!filterSubject || l.subject === filterSubject)
    );
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!form.lessonId || !form.title || !form.description) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (questions.length !== questionLimit) {
      toast({ title: "Validation Error", description: `Quiz must contain exactly ${questionLimit} question${questionLimit !== 1 ? 's' : ''}`, variant: "destructive" });
      return;
    }
    const validQs = questions.filter((q) => stripHtml(q.question) !== "" && q.options.every((o) => o.trim()) && stripHtml(q.explanation) !== "");
    if (validQs.length !== questionLimit) {
      toast({ title: "Validation Error", description: `Please complete all ${questionLimit} questions`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editId) {
        await updateQuiz(editId, { ...form, questions: validQs } as any);
        toast({ title: "Success", description: "Quiz updated successfully" });
      } else {
        await createQuiz({ ...form, questions: validQs } as any);
        toast({ title: "Success", description: "Quiz created successfully" });
      }
      navigate("/admin/content");
    } catch (error: any) {
      toast({ title: "Error", description: error?.response?.data?.error || (isEditing ? "Failed to update quiz" : "Failed to create quiz"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = questions[currentQ];
  const previewQuestion = questions[previewQ] ?? questions[0];

  // ── PREVIEW PANEL ─────────────────────────────────────────────────────────
  if (showPreview) {
    const totalMins = Math.round((form.timeLimit || 600) / 60);
    return (
      <AdminLayout>
        <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
          {/* Preview header */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h1 className="text-xl font-bold">Quiz Preview</h1>
                <Badge variant="secondary" className="text-xs">Student view</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">This is exactly how students will see the quiz</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowPreview(false); }} className="gap-2">
                <EyeOff className="w-4 h-4" />
                Back to Edit
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || isLoadingQuiz || hasConflictingExistingQuiz}
                className="gap-2"
              >
                {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Quiz" : "Create Quiz")}
              </Button>
            </div>
          </div>

          {/* Quiz info card */}
          <Card className="mb-6">
            <CardContent className="pt-5 pb-4">
              <h2 className="text-2xl font-bold mb-1">{form.title || "(No title)"}</h2>
              <p className="text-muted-foreground text-sm mb-4">{form.description || "(No description)"}</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{totalMins} min time limit</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>Passing score: {form.passingScore}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>{questions.length} questions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question navigation dots */}
          <div className="mb-4">
            {isCommonEntrance ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }, (_, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-1.5">
                    {Array.from({ length: 10 }, (_, colIdx) => {
                      const i = rowIdx * 10 + colIdx;
                      const isCurrent = i === previewQ;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewQ(i)}
                          className={`w-7 h-7 rounded-full border text-[10px] font-medium flex items-center justify-center transition ${
                            isCurrent ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-muted-foreground/30 text-foreground'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground ml-1">{rowIdx * 10 + 1}–{rowIdx * 10 + 10}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPreviewQ(i)}
                    className={`w-8 h-8 rounded-full border text-xs font-medium flex items-center justify-center transition ${
                      i === previewQ ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-muted-foreground/30 text-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question card */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Question {previewQ + 1} of {questions.length}
                </span>
              </div>

              {/* Question text */}
              <div
                className="text-base font-medium leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewQuestion.question }}
              />

              {/* Options */}
              <div className="space-y-2">
                {previewQuestion.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === previewQuestion.correctAnswer;
                  return (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition ${
                        isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : 'border-border bg-muted/30 text-foreground'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                        isCorrect ? 'bg-green-500 text-white border-green-500' : 'border-muted-foreground/40 text-muted-foreground'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">Explanation</p>
                <div
                  className="text-sm text-blue-900 dark:text-blue-200 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewQuestion.explanation }}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewQ((i) => Math.max(0, i - 1))}
                  disabled={previewQ === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">{previewQ + 1} / {questions.length}</span>
                <Button
                  type="button"
                  onClick={() => setPreviewQ((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={previewQ === questions.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  // ── END PREVIEW ───────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{isEditing ? "Edit Quiz" : "Create Quiz"}</h1>
              <p className="text-muted-foreground mt-1">
                {isEditing ? "Update a quiz for an existing lesson" : "Create a quiz for an existing lesson"}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/content")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Content
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Lesson selection filters */}
              {isLoadingQuiz && <p className="text-sm text-muted-foreground">Loading quiz details...</p>}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <Select
                    value={filterGrade}
                    onValueChange={(v) => { setFilterGrade(v); setFilterTerm(""); setFilterSubject(""); setForm({ ...form, lessonId: "" }); }}
                    disabled={loading}
                  >
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          {g === "Common Entrance" ? "Common Entrance" : `Grade ${g}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Term *</Label>
                  <Select
                    value={filterTerm}
                    onValueChange={(v) => { setFilterTerm(v); setFilterSubject(""); setForm({ ...form, lessonId: "" }); }}
                    disabled={!filterGrade}
                  >
                    <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>
                      {filterGrade === 'Common Entrance' ? (
                        <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="First Term">First Term</SelectItem>
                          <SelectItem value="Second Term">Second Term</SelectItem>
                          <SelectItem value="Third Term">Third Term</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    value={filterSubject}
                    onValueChange={(v) => { setFilterSubject(v); setForm({ ...form, lessonId: "" }); }}
                    disabled={!filterGrade || !filterTerm}
                  >
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {availableSubjects.length === 0 ? (
                        <SelectItem value="none" disabled>No subjects available</SelectItem>
                      ) : (
                        availableSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lesson *</Label>
                  <Select
                    value={form.lessonId}
                    onValueChange={(v) => setForm({ ...form, lessonId: v })}
                    disabled={!filterGrade || !filterTerm || !filterSubject}
                  >
                    <SelectTrigger><SelectValue placeholder="Select lesson" /></SelectTrigger>
                    <SelectContent>
                      {filteredLessons.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {!filterGrade || !filterTerm || !filterSubject ? "Select grade, term, and subject first" : "No lessons for selected filters"}
                        </SelectItem>
                      ) : (
                        filteredLessons.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                  {checkingExisting && <p className="text-xs text-muted-foreground">Checking for existing quiz…</p>}
                  {hasConflictingExistingQuiz && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2 mt-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">This lesson already has a quiz.</p>
                        <p className="text-xs text-yellow-700 mt-0.5">Each lesson can only have one quiz. Edit the existing one instead.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => navigate(`/admin/create-quiz?edit=${existingQuizId}`)}
                        >
                          Edit Existing Quiz
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quizTitle">Quiz Title *</Label>
                  <Input
                    id="quizTitle"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Quiz title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quizDesc">Description *</Label>
                <Textarea
                  id="quizDesc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Quiz description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    value={form.passingScore}
                    onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 70 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Limit</Label>
                  <Input value="10 minutes (fixed)" disabled />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Questions</Label>
                    <p className="text-xs text-muted-foreground">
                      {isCommonEntrance
                        ? 'Exactly 50 questions required for Common Entrance exams.'
                        : 'Exactly 10 questions are required.'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">{completedCount}/{questionLimit} complete</div>
                </div>

                {/* Question nav dots — single row for 10, grouped rows of 10 for 50 */}
                {isCommonEntrance ? (
                  <div className="space-y-1">
                    {Array.from({ length: 5 }, (_, rowIdx) => (
                      <div key={rowIdx} className="flex items-center gap-1.5">
                        {Array.from({ length: 10 }, (_, colIdx) => {
                          const i = rowIdx * 10 + colIdx;
                          const exists = i < questions.length;
                          const complete = exists && isComplete(questions[i]);
                          const isCurrent = i === currentQ;
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={!exists}
                              onClick={() => exists && setCurrentQ(i)}
                              className={`w-7 h-7 rounded-full border text-[10px] font-medium flex items-center justify-center transition ${
                                isCurrent
                                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                                  : complete
                                  ? 'bg-green-500 text-white border-green-500'
                                  : exists
                                  ? 'border-muted-foreground/30 text-foreground'
                                  : 'border-muted text-muted-foreground opacity-30'
                              }`}
                              title={exists ? (complete ? 'Complete' : 'Incomplete') : 'Locked'}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                        <span className="text-[10px] text-muted-foreground ml-1">{rowIdx * 10 + 1}–{rowIdx * 10 + 10}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const exists = i < questions.length;
                      const complete = exists && isComplete(questions[i]);
                      const isCurrent = i === currentQ;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!exists}
                          onClick={() => exists && setCurrentQ(i)}
                          className={`w-8 h-8 rounded-full border text-xs font-medium flex items-center justify-center transition ${
                            isCurrent
                              ? 'border-blue-600 text-blue-600'
                              : complete
                              ? 'bg-green-500 text-white border-green-500'
                              : exists
                              ? 'border-muted-foreground/30 text-foreground'
                              : 'border-muted text-muted-foreground opacity-50'
                          }`}
                          title={exists ? (complete ? 'Complete' : 'Incomplete') : 'Locked'}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="w-full h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all" style={{ width: `${(completedCount / questionLimit) * 100}%` }} />
                </div>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Question {currentQ + 1}</Label>
                      {currentQ === questions.length - 1 && questions.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={removeLastQuestion}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <RichTextEditor
                      label="Question"
                      value={q.question}
                      onChange={(v) => updateQ("question", v)}
                      placeholder="Enter question text (use the toolbar to insert images)"
                      minHeight="80px"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((option, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                          />
                          <input
                            type="radio"
                            name={`correct-${currentQ}`}
                            checked={q.correctAnswer === oIdx}
                            onChange={() => updateQ("correctAnswer", oIdx)}
                            className="w-4 h-4"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                    <RichTextEditor
                      label="Explanation for the correct answer"
                      value={q.explanation}
                      onChange={(v) => updateQ("explanation", v)}
                      placeholder="Explain why this is the correct answer"
                      minHeight="100px"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentQ((i) => Math.max(0, i - 1))} disabled={currentQ === 0}>
                        Previous
                      </Button>
                      {currentQ === questions.length - 1 ? (
                        questions.length < questionLimit ? (
                          <Button type="button" onClick={addQuestion} disabled={!isComplete(q)}>
                            Add Next Question
                          </Button>
                        ) : (
                          <span className={`text-sm font-medium ${allQuestionsComplete ? "text-green-600" : "text-muted-foreground"}`}>
                            {allQuestionsComplete ? `✓ All ${questionLimit} questions complete` : `Complete all ${questionLimit} questions`}
                          </span>
                        )
                      ) : (
                        <Button type="button" onClick={() => setCurrentQ((i) => Math.min(questions.length - 1, i + 1))} disabled={!isComplete(questions[currentQ])}>
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => navigate("/admin/content")}>Cancel</Button>
                <Button
                  variant="outline"
                  onClick={() => { setPreviewQ(0); setShowPreview(true); }}
                  disabled={!allQuestionsComplete || !form.lessonId || !form.title || !form.description}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Quiz
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLoadingQuiz || !allQuestionsComplete || !form.lessonId || !form.title || !form.description || hasConflictingExistingQuiz}
                >
                  {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Quiz" : "Create Quiz")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateQuiz;
