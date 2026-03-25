import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { createQuiz, getQuizByLessonId, type QuizQuestion } from "@/api/quizzes";
import { ArrowLeft, AlertTriangle, X } from "lucide-react";

const createBlankQuestion = (): QuizQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: -1,
  explanation: "",
});

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    q.question.trim() &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((o) => o.trim()) &&
    q.correctAnswer >= 0 &&
    q.correctAnswer < 4 &&
    q.explanation.trim();

  const completedCount = questions.filter(isComplete).length;
  const allTenComplete = questions.length === 10 && completedCount === 10;

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
    if (questions.length >= 10 || !isComplete(questions[currentQ])) return;
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
    if (questions.length !== 10) {
      toast({ title: "Validation Error", description: "Exam must contain exactly 10 questions", variant: "destructive" });
      return;
    }
    const validQs = questions.filter((q) => q.question.trim() && q.options.every((o) => o.trim()) && q.explanation.trim());
    if (validQs.length !== 10) {
      toast({ title: "Validation Error", description: "Please complete all 10 questions", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuiz({ ...form, questions: validQs } as any);
      toast({ title: "Success", description: "Quiz created successfully" });
      navigate("/admin/content");
    } catch (error: any) {
      toast({ title: "Error", description: error?.response?.data?.error || "Failed to create quiz", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = questions[currentQ];

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10">
            <div>
              <h1 className="text-3xl font-bold">Create Quiz</h1>
              <p className="text-muted-foreground mt-1">Create a quiz for an existing lesson</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/content")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Content
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Lesson selection filters */}
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
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Third Term">Third Term</SelectItem>
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
                  {existingQuizId && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2 mt-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">This lesson already has a quiz.</p>
                        <p className="text-xs text-yellow-700 mt-0.5">Each lesson can only have one quiz. Go to Content Management to edit the existing quiz.</p>
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
                    <p className="text-xs text-muted-foreground">Exactly 10 questions are required.</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{completedCount}/10 complete</div>
                </div>

                {/* Question nav dots */}
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
                            ? "border-blue-600 text-blue-600"
                            : complete
                            ? "bg-green-500 text-white border-green-500"
                            : exists
                            ? "border-muted-foreground/30 text-foreground"
                            : "border-muted text-muted-foreground opacity-50"
                        }`}
                        title={exists ? (complete ? "Complete" : "Incomplete") : "Locked"}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="w-full h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all" style={{ width: `${(completedCount / 10) * 100}%` }} />
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
                    <Input
                      value={q.question}
                      onChange={(e) => updateQ("question", e.target.value)}
                      placeholder="Enter question"
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
                        questions.length < 10 ? (
                          <Button type="button" onClick={addQuestion} disabled={!isComplete(q)}>
                            Add Next Question
                          </Button>
                        ) : (
                          <span className={`text-sm font-medium ${allTenComplete ? "text-green-600" : "text-muted-foreground"}`}>
                            {allTenComplete ? "✓ All 10 questions complete" : "Complete all questions"}
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
                  onClick={handleSubmit}
                  disabled={isSubmitting || !allTenComplete || !form.lessonId || !form.title || !form.description || !!existingQuizId}
                >
                  {isSubmitting ? "Creating..." : "Create Quiz"}
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
