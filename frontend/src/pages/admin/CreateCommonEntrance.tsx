import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { getSubjects, getAllSubjects, type Subject } from "@/api/subjects";
import { createCommonExam, updateCommonExam, getCommonExamById, type CEQuestion } from "@/api/commonEntrance";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X, Upload, Link, BookOpen, ArrowLeft, Save, Loader2, Eye, EyeOff, CheckCircle, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const QUESTION_COUNT = 50;
const CE_DRAFT_KEY = "mindsta_ce_draft";

const createBlankQuestion = (): CEQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: -1 as any,
  explanation: "",
  imageUrl: null,
});

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

const isComplete = (q: CEQuestion) =>
  stripHtml(q.question) !== "" &&
  q.options.length === 4 &&
  q.options.every((o) => o.trim() !== "") &&
  typeof q.correctAnswer === "number" &&
  q.correctAnswer >= 0 &&
  q.correctAnswer <= 3 &&
  stripHtml(q.explanation) !== "";

const CreateCommonEntrance = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("url");
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  // For edit mode or previously saved drafts
  const [savedExamId, setSavedExamId] = useState<string | null>(editId ?? null);
  const [loadingExam, setLoadingExam] = useState(isEditMode);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    overview: "",
    subject: "",
    imageUrl: "",
    imageDisplaySize: "full",
    imageObjectFit: "cover",
    price: 0,
    passingScore: 90,
    timeLimit: 3000,
    isPublished: true,
  });

  const [questions, setQuestions] = useState<CEQuestion[]>([createBlankQuestion()]);
  const [currentQ, setCurrentQ] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQ, setPreviewQ] = useState(0);

  useEffect(() => {
    getAllSubjects().then(setSubjects).catch(console.error);
  }, []);

  // In edit mode: load existing exam data
  useEffect(() => {
    if (!editId) return;
    setLoadingExam(true);
    getCommonExamById(editId)
      .then((exam) => {
        if (!exam) { toast({ title: "Not found", description: "Exam not found.", variant: "destructive" }); navigate("/admin/common-entrance"); return; }
        setForm({
          title: exam.title,
          subtitle: exam.subtitle ?? "",
          description: exam.description ?? "",
          overview: exam.overview ?? "",
          subject: exam.subject,
          imageUrl: exam.imageUrl ?? "",
          imageDisplaySize: exam.imageDisplaySize ?? "full",
          imageObjectFit: exam.imageObjectFit ?? "cover",
          price: exam.price,
          passingScore: exam.passingScore,
          timeLimit: exam.timeLimit,
          isPublished: exam.isPublished,
        });
        if (exam.questions?.length) {
          setQuestions(exam.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            imageUrl: q.imageUrl ?? null,
          })));
        }
      })
      .catch(() => toast({ title: "Error", description: "Failed to load exam.", variant: "destructive" }))
      .finally(() => setLoadingExam(false));
  }, [editId]);

  // On mount: check for a saved draft and prompt the user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CE_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.timestamp) {
        setDraftTimestamp(parsed.timestamp);
        setShowDraftPrompt(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save draft every time form or questions change (2.5s debounce)
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (form.title || form.subject || questions.some(q => q.question)) {
        try {
          const draft = { form, questions, currentQ, timestamp: new Date().toISOString() };
          localStorage.setItem(CE_DRAFT_KEY, JSON.stringify(draft));
          setDraftTimestamp(draft.timestamp);
        } catch { /* ignore */ }
      }
    }, 2500);
    return () => window.clearTimeout(id);
  }, [form, questions, currentQ]);

  const saveDraftManually = async () => {
    if (!form.title.trim() || !form.subject) {
      toast({ title: "Required fields missing", description: "Please enter a title and subject before saving.", variant: "destructive" });
      return;
    }
    setIsSavingDraft(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        overview: form.overview.trim(),
        subject: form.subject,
        imageUrl: form.imageUrl || null,
        imageDisplaySize: form.imageDisplaySize,
        imageObjectFit: form.imageObjectFit,
        price: form.price,
        questions,
        passingScore: form.passingScore,
        timeLimit: form.timeLimit,
        isPublished: false,
      };
      let saved;
      if (savedExamId) {
        saved = await updateCommonExam(savedExamId, payload);
      } else {
        saved = await createCommonExam(payload);
        setSavedExamId(saved.id);
        // Also update localStorage draft with the new id for recovery
        try { localStorage.removeItem(CE_DRAFT_KEY); } catch { /* */ }
      }
      const ts = new Date().toISOString();
      setDraftTimestamp(ts);
      toast({ title: "Draft Saved", description: "Draft saved to server. You can continue later from the exam list." });
      navigate("/admin/common-entrance");
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error || "Failed to save draft.", variant: "destructive" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(CE_DRAFT_KEY);
    setDraftTimestamp(null);
  };

  const continueDraft = () => {
    try {
      const raw = localStorage.getItem(CE_DRAFT_KEY);
      if (!raw) return;
      const { form: savedForm, questions: savedQuestions, currentQ: savedQ } = JSON.parse(raw);
      if (savedForm) setForm(savedForm);
      if (savedQuestions?.length) setQuestions(savedQuestions);
      if (typeof savedQ === 'number') setCurrentQ(savedQ);
    } catch { /* ignore */ }
    setShowDraftPrompt(false);
  };

  const discardDraft = () => {
    clearDraft();
    setShowDraftPrompt(false);
  };

  const fe = (val: string | undefined | null) => showErrors && !val?.trim();

  const updateQ = (field: keyof CEQuestion, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[currentQ] = { ...updated[currentQ], [field]: value };
      return updated;
    });
  };

  const updateOption = (oIdx: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[currentQ].options] as [string, string, string, string];
      opts[oIdx] = value;
      updated[currentQ] = { ...updated[currentQ], options: opts };
      return updated;
    });
  };

  const addQuestion = () => {
    if (questions.length >= QUESTION_COUNT || !isComplete(questions[currentQ])) return;
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

  const processThumbnailFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, imageUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const missing: string[] = [];
    if (!form.title.trim()) missing.push("Title");
    if (!form.subject) missing.push("Subject");
    if (missing.length > 0) {
      setShowErrors(true);
      toast({ title: "Missing Required Fields", description: `Please fill in: ${missing.join(", ")}`, variant: "destructive" });
      return;
    }

    if (questions.length !== QUESTION_COUNT) {
      toast({ title: "Incomplete", description: `You need exactly ${QUESTION_COUNT} questions (${questions.length} added so far).`, variant: "destructive" });
      return;
    }

    if (!allComplete) {
      toast({ title: "Incomplete Questions", description: `Please complete all ${QUESTION_COUNT} questions before submitting.`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        overview: form.overview.trim(),
        subject: form.subject,
        imageUrl: form.imageUrl || null,
        imageDisplaySize: form.imageDisplaySize,
        imageObjectFit: form.imageObjectFit,
        price: form.price,
        questions,
        passingScore: form.passingScore,
        timeLimit: form.timeLimit,
        isPublished: form.isPublished,
      };
      if (savedExamId) {
        await updateCommonExam(savedExamId, payload);
      } else {
        await createCommonExam(payload);
      }
      toast({ title: "Success", description: isEditMode ? "Exam updated successfully." : "Common Entrance exam created successfully." });
      clearDraft();
      navigate("/admin/common-entrance");
    } catch (error: any) {
      toast({ title: "Error", description: error?.response?.data?.error || "Failed to save exam.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = questions[currentQ];
  const completedCount = questions.filter(isComplete).length;
  const allComplete = questions.length === QUESTION_COUNT && completedCount === QUESTION_COUNT;

  // ── PREVIEW PANEL ──
  if (showPreview) {
    const pq = questions[previewQ];
    const timeLimitLabel = form.timeLimit
      ? (() => { const m = Math.round(form.timeLimit / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? m % 60 + 'm' : ''}`.trim() : `${m} min`; })()
      : 'N/A';

    return (
      <AdminLayout>
        <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
          {/* Preview header */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10 mb-6">
            <div>
              <Badge variant="outline" className="mb-1 gap-1 text-purple-600 border-purple-300">
                <Eye className="w-3 h-3" /> Student Preview
              </Badge>
              <h1 className="text-xl font-bold">{form.title || "Untitled Exam"}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="gap-2">
                <EyeOff className="w-4 h-4" /> Back to Edit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !allComplete || !form.title.trim() || !form.subject}
              >
                {isSubmitting ? (isEditMode ? "Saving…" : "Creating…") : (isEditMode ? "Save Changes" : "Create Exam")}
              </Button>
            </div>
          </div>

          {/* Exam info card */}
          <Card className="mb-6">
            <CardContent className="pt-5 space-y-3">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Thumbnail" className="w-full max-h-48 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <h2 className="text-xl font-bold">{form.title}</h2>
              {(form.subtitle || form.description) && <p className="text-muted-foreground text-sm">{form.subtitle || form.description}</p>}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground"><BookOpen className="w-4 h-4" /> {QUESTION_COUNT} Questions</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" /> {timeLimitLabel}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Target className="w-4 h-4" /> Pass: {form.passingScore}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Question navigation dots (5×10) */}
          <div className="mb-4 space-y-1.5">
            {Array.from({ length: 5 }, (_, rowIdx) => (
              <div key={rowIdx} className="flex gap-1.5">
                {Array.from({ length: 10 }, (_, colIdx) => {
                  const i = rowIdx * 10 + colIdx;
                  const complete = i < questions.length && isComplete(questions[i]);
                  const isCurrent = i === previewQ;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={i >= questions.length}
                      onClick={() => setPreviewQ(i)}
                      className={`w-7 h-7 rounded-full border text-[10px] font-medium flex items-center justify-center transition-all ${
                        isCurrent
                          ? "border-purple-600 text-purple-600 bg-purple-50 ring-2 ring-purple-200"
                          : complete
                          ? "bg-green-500 text-white border-green-500"
                          : "border-muted-foreground/40 text-foreground opacity-40"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Current question */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question {previewQ + 1} of {QUESTION_COUNT}</div>
              <div
                className="text-base leading-relaxed [&_img]:max-w-full [&_img]:rounded"
                dangerouslySetInnerHTML={{ __html: pq.question || '<em class="text-muted-foreground">No question text</em>' }}
              />
              {pq.imageUrl && <img src={pq.imageUrl} alt="Question" className="max-w-full rounded-lg" />}

              {/* Options */}
              <div className="space-y-2">
                {pq.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === pq.correctAnswer;
                  return (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                        isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 font-medium" : "border-muted"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/50"}`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt || <em className="text-muted-foreground">Empty option</em>}</span>
                      {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {pq.explanation && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Explanation</p>
                  <div
                    className="text-sm text-blue-800 dark:text-blue-200 [&_img]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: pq.explanation }}
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="outline" onClick={() => setPreviewQ(i => Math.max(0, i - 1))} disabled={previewQ === 0}>← Previous</Button>
                <span className="text-xs text-muted-foreground">{previewQ + 1} / {QUESTION_COUNT}</span>
                <Button variant="outline" onClick={() => setPreviewQ(i => Math.min(QUESTION_COUNT - 1, i + 1))} disabled={previewQ >= QUESTION_COUNT - 1}>Next →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (loadingExam) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{isEditMode ? "Edit Common Entrance Exam" : "Create Common Entrance Exam"}</h1>
              <p className="text-muted-foreground mt-1">
                Build a 50-question exam for a subject
                {draftTimestamp && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    · Draft auto-saved {new Date(draftTimestamp).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditMode && (
              <Button size="sm" variant="outline" onClick={saveDraftManually} disabled={isSavingDraft} className="gap-2">
                <Save className="w-4 h-4" />
                {isSavingDraft ? "Saving…" : "Save Draft"}
              </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate("/admin/common-entrance")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Exam Information
              </CardTitle>
              <CardDescription>Basic details shown to students on the exam card</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Common Entrance Mathematics"
                    className={fe(form.title) ? "border-destructive" : ""}
                  />
                  {fe(form.title) && <p className="text-xs text-destructive">Title is required</p>}
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                    <SelectTrigger className={fe(form.subject) ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fe(form.subject) && <p className="text-xs text-destructive">Subject is required</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Short Description (shown on card)</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="e.g., Master all 50 topics covered in Common Entrance Mathematics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this exam (optional)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Exam Overview (shown to students before purchase)</Label>
                <RichTextEditor
                  value={form.overview}
                  onChange={(v) => setForm({ ...form, overview: v })}
                  placeholder="Describe what students will learn, what topics are covered, and what they can expect…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min={1}
                    max={100}
                    value={form.passingScore}
                    onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 90 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Limit</Label>
                  <Select
                    value={String(form.timeLimit)}
                    onValueChange={(v) => setForm({ ...form, timeLimit: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="2700">45 minutes</SelectItem>
                      <SelectItem value="3000">50 minutes</SelectItem>
                      <SelectItem value="3600">60 minutes</SelectItem>
                      <SelectItem value="5400">90 minutes</SelectItem>
                      <SelectItem value="7200">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₦) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={100}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {form.price === 0
                    ? "💚 This exam will be FREE for students"
                    : `Students will pay ₦${form.price.toLocaleString()} for this exam`}
                </p>
              </div>

              {/* Thumbnail */}
              <div className="space-y-3">
                <Label>Exam Thumbnail (Optional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={thumbnailMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThumbnailMode("url")}
                    className="gap-2"
                  >
                    <Link className="w-4 h-4" /> URL
                  </Button>
                  <Button
                    type="button"
                    variant={thumbnailMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThumbnailMode("upload")}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </Button>
                </div>

                {thumbnailMode === "url" ? (
                  <Input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDraggingThumbnail ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                    onClick={() => imageFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                    onDragLeave={() => setIsDraggingThumbnail(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingThumbnail(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processThumbnailFile(file);
                    }}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click or drag to upload (max 5MB)</p>
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processThumbnailFile(file);
                      }}
                    />
                  </div>
                )}

                {form.imageUrl && (
                  <div className="relative mt-2 rounded-lg overflow-hidden border bg-muted/20" style={{ aspectRatio: "16/9", maxHeight: ({ full: 300, large: 220, medium: 160, small: 100 } as Record<string, number>)[form.imageDisplaySize] || 120 }}>
                    <img
                      src={form.imageUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full"
                      style={{ objectFit: form.imageObjectFit as any || "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                  </div>
                )}
                {/* Image display size controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Display Size</Label>
                    <Select value={form.imageDisplaySize} onValueChange={(v) => setForm({ ...form, imageDisplaySize: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Width</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Image Fit</Label>
                    <Select value={form.imageObjectFit} onValueChange={(v) => setForm({ ...form, imageObjectFit: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover (fill &amp; crop)</SelectItem>
                        <SelectItem value="contain">Contain (show full)</SelectItem>
                        <SelectItem value="fill">Fill (stretch)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Publish toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="isPublished"
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Publish immediately (visible to students)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Questions ({completedCount}/{QUESTION_COUNT} complete)</CardTitle>
                  <CardDescription>Exactly 50 questions are required for a Common Entrance exam</CardDescription>
                </div>
                <span className={`text-sm font-medium ${allComplete ? "text-green-600" : "text-muted-foreground"}`}>
                  {allComplete ? "✓ All questions complete" : `${questions.length}/${QUESTION_COUNT} added`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 5×10 grid navigation */}
              <div className="space-y-1.5">
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
                          className={`w-7 h-7 rounded-full border text-[10px] font-medium flex items-center justify-center transition-all ${
                            isCurrent
                              ? "border-blue-600 text-blue-600 bg-blue-50 ring-2 ring-blue-200"
                              : complete
                              ? "bg-green-500 text-white border-green-500"
                              : exists
                              ? "border-muted-foreground/40 text-foreground hover:border-primary"
                              : "border-muted text-muted-foreground opacity-25 cursor-not-allowed"
                          }`}
                          title={!exists ? "Locked" : complete ? "Complete" : "Incomplete"}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {rowIdx * 10 + 1}–{rowIdx * 10 + 10}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(completedCount / QUESTION_COUNT) * 100}%` }}
                />
              </div>

              {/* Current question editor */}
              <Card className="p-4 border-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Question {currentQ + 1} of {QUESTION_COUNT}</Label>
                    {currentQ === questions.length - 1 && questions.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={removeLastQuestion} className="text-destructive hover:text-destructive">
                        <X className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    )}
                  </div>

                  <RichTextEditor
                    label="Question Text *"
                    value={q.question}
                    onChange={(v) => updateQ("question", v)}
                    placeholder="Type the question here (use toolbar for images, formatting, etc.)"
                    minHeight="80px"
                  />

                  {/* Options */}
                  <div className="space-y-2">
                    <Label>Answer Options * (select the correct one)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((option, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground w-5 flex-shrink-0">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <Input
                            value={option}
                            onChange={(e) => updateOption(oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className={`flex-1 ${q.correctAnswer === oIdx ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}`}
                          />
                          <input
                            type="radio"
                            name={`correct-${currentQ}`}
                            checked={q.correctAnswer === oIdx}
                            onChange={() => updateQ("correctAnswer", oIdx)}
                            className="w-4 h-4 accent-green-600"
                            title="Mark as correct answer"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select the radio button (✓) next to the correct answer</p>
                  </div>

                  <RichTextEditor
                    label="Explanation for Correct Answer *"
                    value={q.explanation}
                    onChange={(v) => updateQ("explanation", v)}
                    placeholder="Explain why this is the correct answer (shown after submission)"
                    minHeight="80px"
                  />

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentQ((i) => Math.max(0, i - 1))}
                      disabled={currentQ === 0}
                    >
                      ← Previous
                    </Button>

                    {currentQ === questions.length - 1 ? (
                      questions.length < QUESTION_COUNT ? (
                        <Button
                          type="button"
                          onClick={addQuestion}
                          disabled={!isComplete(q)}
                          title={!isComplete(q) ? "Complete this question first" : ""}
                        >
                          Add Question {questions.length + 1} →
                        </Button>
                      ) : (
                        <span className={`text-sm font-medium ${allComplete ? "text-green-600" : "text-amber-600"}`}>
                          {allComplete ? `✓ All ${QUESTION_COUNT} questions complete` : `Complete all ${QUESTION_COUNT} questions`}
                        </span>
                      )
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setCurrentQ((i) => Math.min(questions.length - 1, i + 1))}
                        disabled={!isComplete(questions[currentQ])}
                      >
                        Next →
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => navigate("/admin/common-entrance")}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => { setPreviewQ(0); setShowPreview(true); }}
              disabled={!allComplete || !form.title.trim() || !form.subject}
              className="gap-2"
            >
              <Eye className="w-4 h-4" /> Preview Exam
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !allComplete || !form.title.trim() || !form.subject}
              className="min-w-[160px]"
            >
              {isSubmitting ? (isEditMode ? "Saving…" : "Creating…") : (isEditMode ? "Save Changes" : "Create Exam")}
            </Button>
          </div>
        </div>
      </div>

      {/* Draft Resume Dialog */}
      <AlertDialog open={showDraftPrompt} onOpenChange={setShowDraftPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume saved draft?</AlertDialogTitle>
            <AlertDialogDescription>
              A saved Common Entrance exam draft was found.
              {draftTimestamp && (
                <span className="block text-sm text-muted-foreground mt-2">
                  Last saved: {new Date(draftTimestamp).toLocaleString()}.
                </span>
              )}
              Would you like to continue from where you left off, or start a new exam?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={continueDraft} className="bg-primary text-white hover:bg-primary/90">
              Continue Draft
            </AlertDialogAction>
            <AlertDialogAction onClick={discardDraft} className="bg-slate-700 text-white hover:bg-slate-800">
              Start Fresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default CreateCommonEntrance;
