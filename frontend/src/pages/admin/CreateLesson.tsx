import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { VideoPlayer } from "@/components/VideoPlayer";
import AdminLayout from "@/components/AdminLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { createLesson, getLessonById, updateLesson, type Section } from "@/api/lessons";
import { getAllSubjects, getSubjects, type Subject } from "@/api/subjects";
import { BookOpen, CheckCircle, Plus, X, Link, ArrowLeft } from "lucide-react";

const DRAFT_KEY = "mindsta_lesson_draft";
const CURRICULUM_DRAFT_KEY = "mindsta_curriculum_draft";
const LOCAL_DRAFT_ID = "local-lesson-draft";

const CreateLesson = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isLocalDraftEdit = editId === LOCAL_DRAFT_ID;
  const isEditing = !!editId && !isLocalDraftEdit;
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [showDiscardDraftConfirm, setShowDiscardDraftConfirm] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftPromptTimestamp, setDraftPromptTimestamp] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("url");
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [curriculum, setCurriculum] = useState<Section[]>([]);

  const initialForm = {
    title: "",
    subtitle: "",
    description: "",
    overview: "",
    subject: "",
    grade: "",
    term: "",
    difficulty: "",
    videoUrl: "",
    imageUrl: "",
    imageDisplaySize: "full",
    imageObjectFit: "cover",
    order: 0,
    duration: 30,
    price: 0,
    isPublished: true,
    whatYouWillLearn: [] as string[],
    requirements: [] as string[],
    targetAudience: [] as string[],
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    getSubjects().then(setSubjects).catch(console.error);
    if (isLocalDraftEdit) {
      // Load the locally saved draft for editing/continuation.
      try {
        const draftStr = localStorage.getItem(DRAFT_KEY);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          setForm(draft.lessonForm || initialForm);
          setCurriculum(draft.curriculum || []);
          setDraftLoaded(true);
          setDraftTimestamp(draft.timestamp || null);
        } else {
          toast({ title: 'Draft not found', description: 'No saved lesson draft exists.', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load saved draft.', variant: 'destructive' });
      }
    } else if (isEditing && editId) {
      // Load existing lesson for editing
      getLessonById(editId).then((lesson) => {
        if (!lesson) {
          toast({ title: 'Lesson not found', description: 'Could not load the lesson to edit.', variant: 'destructive' });
          return;
        }
        setForm({
          title: lesson.title || '',
          subtitle: (lesson as any).subtitle || '',
          description: lesson.description || '',
          overview: (lesson as any).overview || '',
          subject: lesson.subject || '',
          grade: lesson.grade || '',
          term: lesson.term || '',
          difficulty: lesson.difficulty || '',
          videoUrl: lesson.videoUrl || '',
          imageUrl: lesson.imageUrl || '',
          imageDisplaySize: (lesson as any).imageDisplaySize || 'full',
          imageObjectFit: (lesson as any).imageObjectFit || 'cover',
          order: (lesson as any).order || 0,
          duration: lesson.duration || 30,
          price: (lesson as any).price || 0,
          isPublished: (lesson as any).isPublished ?? true,
          whatYouWillLearn: (lesson as any).whatYouWillLearn || [],
          requirements: (lesson as any).requirements || [],
          targetAudience: (lesson as any).targetAudience || [],
        });
        if ((lesson as any).curriculum) {
          setCurriculum((lesson as any).curriculum);
        }
      }).catch(() => {
        toast({ title: 'Error', description: 'Failed to load lesson', variant: 'destructive' });
      });
    }
  }, [editId, isEditing, isLocalDraftEdit]);

  useEffect(() => {
    if (isEditing || isLocalDraftEdit) return;

    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (!draftStr) return;
      const draft = JSON.parse(draftStr);
      setDraftPromptTimestamp(draft.timestamp || null);
      setShowDraftPrompt(true);
    } catch {
      // ignore invalid draft data
    }
  }, [isEditing, isLocalDraftEdit]);

  useEffect(() => {
    if (isEditing) return;
    const draftAutoSave = () => {
      try {
        const draft = { lessonForm: form, curriculum, timestamp: new Date().toISOString() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        localStorage.setItem(CURRICULUM_DRAFT_KEY, JSON.stringify(curriculum));
        setDraftTimestamp(draft.timestamp);
      } catch (_) {
        // ignore auto-save failures
      }
    };

    const timeoutId = window.setTimeout(() => {
      if (form.title || form.description || form.subject || form.grade || form.term) {
        draftAutoSave();
      }
    }, 2500);
    return () => window.clearTimeout(timeoutId);
  }, [form, curriculum, isEditing]);

  // Auto-fill duration from direct video files
  useEffect(() => {
    const url = form.videoUrl?.trim();
    if (!url) return;
    if (/^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const minutes = Math.ceil(video.duration / 60);
        if (minutes > 0 && isFinite(minutes)) {
          setForm(prev => ({ ...prev, duration: minutes }));
        }
      };
      video.src = url;
    }
  }, [form.videoUrl]);

  const saveProgressDraft = () => {
    setIsSavingProgress(true);
    try {
      const draft = { lessonForm: form, curriculum, timestamp: new Date().toISOString() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      localStorage.setItem(CURRICULUM_DRAFT_KEY, JSON.stringify(curriculum));
      setDraftLoaded(true);
      setDraftTimestamp(draft.timestamp);
      toast({ title: "Progress Saved", description: "Your work has been saved. You can continue later." });
    } catch (_) {
      toast({ title: "Error", description: "Failed to save progress", variant: "destructive" });
    } finally {
      setIsSavingProgress(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(CURRICULUM_DRAFT_KEY);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftLoaded(false);
    setDraftTimestamp(null);
    if (!isEditing) {
      setForm(initialForm);
      setCurriculum([]);
    }
    toast({ title: "Draft Discarded", description: "Saved lesson progress has been removed." });
  };

  const processThumbnailFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((prev) => ({ ...prev, imageUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const continueDraftFromPrompt = () => {
    setShowDraftPrompt(false);
    navigate(`/admin/create-lesson?edit=${LOCAL_DRAFT_ID}`);
  };

  const startNewLessonFromPrompt = () => {
    clearDraft();
    setShowDraftPrompt(false);
    setDraftLoaded(false);
    setDraftTimestamp(null);
    setForm(initialForm);
    setCurriculum([]);
    toast({
      title: "Start a fresh lesson",
      description: "Your saved draft has been cleared so you can begin a new lesson.",
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const missing: string[] = [];
    if (!form.title) missing.push("Title");
    if (!form.description) missing.push("Description");
    if (!form.subject) missing.push("Subject");
    if (!form.grade) missing.push("Grade");
    if (!form.term) missing.push("Term");
    if (!form.difficulty) missing.push("Difficulty");
    if (missing.length > 0) {
      toast({ title: "Missing Required Fields", description: `Please fill in: ${missing.join(", ")}`, variant: "destructive" });
      return;
    }
    if (form.title.length < 5) {
      toast({ title: "Invalid Title", description: "Title must be at least 5 characters.", variant: "destructive" });
      return;
    }
    if (form.videoUrl?.trim()) {
      const url = form.videoUrl.trim();
      const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(url);
      const isDirect = /^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
      const isEmbed = /youtube(?:-nocookie)?\.com\/embed\//i.test(url);
      if (!isYoutube && !isDirect && !isEmbed) {
        toast({ title: "Invalid Video URL", description: "Please enter a valid YouTube link or direct video URL (.mp4, .webm).", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        difficulty: form.difficulty,
        keywords: [],
        learningObjectives: [],
        curriculum,
      } as any;
      if (isEditing && editId) {
        await updateLesson(editId, payload);
        toast({ title: "Success", description: "Lesson updated successfully" });
        navigate("/admin/lesson-management");
      } else {
        await createLesson(payload);
        clearDraft();
        toast({ title: "Success", description: "Lesson created successfully" });
        navigate("/admin/lesson-management");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.response?.data?.error || (isEditing ? "Failed to update lesson" : "Failed to create lesson"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{isEditing ? 'Edit Lesson' : 'Create Lesson'}</h1>
              <p className="text-muted-foreground mt-1">{isEditing ? 'Update the lesson details below' : 'Fill in the lesson details below'}</p>
              {!isEditing && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mt-1">💡 Click "Save Progress" to save your work and return later.</p>
                  {draftLoaded && draftTimestamp && (
                    <p className="text-xs text-foreground/80">Draft restored from {new Date(draftTimestamp).toLocaleString()}.</p>
                  )}
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/lesson-management")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Lessons
            </Button>
          </div>

          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Basic Lesson Information
                </CardTitle>
                <CardDescription>Enter the fundamental details about this lesson</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Lesson Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Introduction to Algebra"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                    <Input
                      id="subtitle"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="Brief subtitle"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description that appears in lesson cards"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">Keep it concise — this appears in lesson previews</p>
                </div>

                <div className="space-y-2">
                  <Label>Course Overview (For Student Preview)</Label>
                  <Textarea
                    value={form.overview}
                    onChange={(e) => setForm({ ...form, overview: e.target.value })}
                    placeholder="What will students learn in this course?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Grade Level *</Label>
                    <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                      <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                        ))}
                        <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Term *</Label>
                    <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                      <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term">First Term</SelectItem>
                        <SelectItem value="Second Term">Second Term</SelectItem>
                        <SelectItem value="Third Term">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty *</Label>
                    <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                      <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">🟢 Beginner</SelectItem>
                        <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                        <SelectItem value="advanced">🔴 Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                      placeholder="30"
                    />
                    <p className="text-xs text-muted-foreground">
                      {/^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(form.videoUrl || '')
                        ? "⚡ Auto-filled from video file"
                        : "Enter duration in minutes. Auto-filled for direct video files (not YouTube)."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video & Media */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Video &amp; Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                    <Input
                      id="videoUrl"
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      type="url"
                      className={
                        form.videoUrl?.trim() &&
                        !/(?:youtube\.com|youtu\.be|youtube-nocookie\.com\/embed)/i.test(form.videoUrl) &&
                        !/^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(form.videoUrl)
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {form.videoUrl?.trim() &&
                      (/(?:youtube\.com|youtu\.be|youtube-nocookie\.com\/embed)/i.test(form.videoUrl)
                        ? <p className="text-xs text-green-600">✓ Valid YouTube URL</p>
                        : /^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(form.videoUrl)
                        ? <p className="text-xs text-green-600">✓ Valid direct video URL</p>
                        : <p className="text-xs text-destructive">⚠ Must be a YouTube link or direct video URL</p>)}
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail Image (Optional)</Label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setThumbnailMode("url")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${thumbnailMode === "url" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary"}`}
                      >
                        <Link className="w-3.5 h-3.5" /> Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailMode("upload")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${thumbnailMode === "upload" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary"}`}
                      >
                        Upload File
                      </button>
                    </div>
                    {thumbnailMode === "url" ? (
                      <Input
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDraggingThumbnail ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                        onDragLeave={() => setIsDraggingThumbnail(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDraggingThumbnail(false); const file = e.dataTransfer.files[0]; if (file) processThumbnailFile(file); }}
                      >
                        <label className="cursor-pointer block">
                          <p className="text-sm text-muted-foreground">{isDraggingThumbnail ? "Drop image here" : "Click to upload or drag & drop"}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, GIF, WebP · Max 5MB</p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            ref={imageFileInputRef}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) processThumbnailFile(file); e.target.value = ""; }}
                          />
                        </label>
                      </div>
                    )}
                    {form.imageUrl && (
                      <div className="relative mt-2 rounded-lg overflow-hidden border bg-muted/20" style={{ aspectRatio: "16/9", maxHeight: { full: 300, large: 220, medium: 160, small: 100 }[form.imageDisplaySize] || 120 }}>
                        <img src={form.imageUrl} alt="Thumbnail preview" className="w-full h-full" style={{ objectFit: form.imageObjectFit as any || "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                </div>

                {form.videoUrl?.trim() && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">📽️ Video Preview</Label>
                    <VideoPlayer
                      videoUrl={form.videoUrl}
                      title={form.title || "Lesson Preview"}
                      enableDownload={false}
                      onDurationDetected={(mins) => setForm((prev) => ({ ...prev, duration: mins }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Course Details (Shown on Student Overview)
                </CardTitle>
                <CardDescription>These appear on the student's subject overview page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* What you'll learn */}
                <div className="space-y-3">
                  <Label>What Students Will Learn</Label>
                  <div className="space-y-2">
                    {form.whatYouWillLearn.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <Input
                          value={item}
                          onChange={(e) => {
                            const updated = [...form.whatYouWillLearn];
                            updated[i] = e.target.value;
                            setForm({ ...form, whatYouWillLearn: updated });
                          }}
                          placeholder={`Learning outcome ${i + 1}`}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, whatYouWillLearn: form.whatYouWillLearn.filter((_, idx) => idx !== i) })}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setForm({ ...form, whatYouWillLearn: [...form.whatYouWillLearn, ""] })}>
                      <Plus className="w-4 h-4" /> Add Learning Outcome
                    </Button>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <Label>Requirements / Prerequisites</Label>
                  <div className="space-y-2">
                    {form.requirements.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const updated = [...form.requirements];
                            updated[i] = e.target.value;
                            setForm({ ...form, requirements: updated });
                          }}
                          placeholder={`Requirement ${i + 1}`}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, requirements: form.requirements.filter((_, idx) => idx !== i) })}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setForm({ ...form, requirements: [...form.requirements, ""] })}>
                      <Plus className="w-4 h-4" /> Add Requirement
                    </Button>
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-3">
                  <Label>Target Audience</Label>
                  <div className="space-y-2">
                    {form.targetAudience.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const updated = [...form.targetAudience];
                            updated[i] = e.target.value;
                            setForm({ ...form, targetAudience: updated });
                          }}
                          placeholder={`Target audience ${i + 1}`}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, targetAudience: form.targetAudience.filter((_, idx) => idx !== i) })}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setForm({ ...form, targetAudience: [...form.targetAudience, ""] })}>
                      <Plus className="w-4 h-4" /> Add Target Audience
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curriculum Builder */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">📑 Course Curriculum (Optional)</CardTitle>
                    <CardDescription>Add sections and lectures to structure your course content</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setCurriculum([...curriculum, { title: "", description: "", order: curriculum.length + 1, lectures: [] }])}
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {curriculum.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <p className="text-sm">No sections yet. Click "Add Section" to begin structuring your course.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {curriculum.map((section, sIdx) => (
                      <Card key={sIdx} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={section.title}
                                onChange={(e) => {
                                  const updated = [...curriculum];
                                  updated[sIdx] = { ...section, title: e.target.value };
                                  setCurriculum(updated);
                                }}
                                placeholder={`Section ${sIdx + 1} title`}
                                className="font-medium"
                              />
                              <Input
                                value={section.description || ""}
                                onChange={(e) => {
                                  const updated = [...curriculum];
                                  updated[sIdx] = { ...section, description: e.target.value };
                                  setCurriculum(updated);
                                }}
                                placeholder="Section description (optional)"
                                className="text-sm"
                              />
                            </div>
                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCurriculum(curriculum.filter((_, i) => i !== sIdx))}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="pl-4 space-y-2">
                            {section.lectures.map((lecture, lIdx) => (
                              <div key={lIdx} className="flex items-center gap-2 bg-muted/30 rounded p-2">
                                <Select
                                  value={lecture.type}
                                  onValueChange={(val) => {
                                    const updated = [...curriculum];
                                    updated[sIdx].lectures[lIdx] = { ...lecture, type: val as any };
                                    setCurriculum(updated);
                                  }}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="video">🎬 Video</SelectItem>
                                    <SelectItem value="article">📄 Article</SelectItem>
                                    <SelectItem value="quiz">✏️ Quiz</SelectItem>
                                    <SelectItem value="assignment">📎 Assignment</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={lecture.title}
                                  onChange={(e) => {
                                    const updated = [...curriculum];
                                    updated[sIdx].lectures[lIdx] = { ...lecture, title: e.target.value };
                                    setCurriculum(updated);
                                  }}
                                  placeholder={`Lecture ${lIdx + 1} title`}
                                  className="flex-1 h-8 text-sm"
                                />
                                <Input
                                  type="number"
                                  value={lecture.duration}
                                  onChange={(e) => {
                                    const updated = [...curriculum];
                                    updated[sIdx].lectures[lIdx] = { ...lecture, duration: parseInt(e.target.value) || 0 };
                                    setCurriculum(updated);
                                  }}
                                  placeholder="Mins"
                                  className="w-16 h-8 text-xs"
                                  min="0"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  onClick={() => {
                                    const updated = [...curriculum];
                                    updated[sIdx].lectures = section.lectures.filter((_, i) => i !== lIdx);
                                    setCurriculum(updated);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => {
                                const updated = [...curriculum];
                                updated[sIdx].lectures = [...section.lectures, { title: "", type: "video", duration: 0, order: section.lectures.length + 1 }];
                                setCurriculum(updated);
                              }}
                            >
                              <Plus className="w-3 h-3" /> Add Lecture
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Pricing</CardTitle>
                <CardDescription>Set the price for this lesson</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Lesson Price (₦) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="100"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      {form.price === 0 ? "💚 This lesson will be FREE for students" : `Students will pay ₦${form.price.toLocaleString()} for this lesson`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {!isEditing && (
                      <Button variant="secondary" onClick={saveProgressDraft} disabled={isSavingProgress} className="gap-2">
                        {isSavingProgress ? "Saving..." : "💾 Save Progress"}
                      </Button>
                    )}
                    {!isEditing && draftLoaded && (
                      <Button variant="outline" onClick={() => setShowDiscardDraftConfirm(true)} className="gap-2">
                        Discard Saved Draft
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        id="isPublished"
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                      />
                      <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer select-none">
                        {form.isPublished ? "Published" : "Draft (hidden from students)"}
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/admin/lessons")}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Lesson" : "Create Lesson")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDiscardDraftConfirm}
        onOpenChange={setShowDiscardDraftConfirm}
        onConfirm={handleDiscardDraft}
        title="Discard Saved Draft"
        description="This will delete your saved lesson progress and cannot be undone. Are you sure you want to continue?"
        confirmText="Discard"
        cancelText="Keep Draft"
        destructive
      />
      <AlertDialog open={showDraftPrompt} onOpenChange={setShowDraftPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume existing draft?</AlertDialogTitle>
            <AlertDialogDescription>
              A saved lesson draft was found.
              {draftPromptTimestamp && (
                <span className="block text-sm text-muted-foreground mt-2">
                  Last saved: {new Date(draftPromptTimestamp).toLocaleString()}.
                </span>
              )}
              Choose whether to continue your draft or start a new lesson from scratch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={continueDraftFromPrompt} className="bg-primary text-white hover:bg-primary/90">
              Continue Draft
            </AlertDialogAction>
            <AlertDialogAction onClick={startNewLessonFromPrompt} className="bg-slate-700 text-white hover:bg-slate-800">
              Start New Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default CreateLesson;
