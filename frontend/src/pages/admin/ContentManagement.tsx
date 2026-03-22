import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getAllLessons, createLesson, updateLesson, deleteLesson, type Lesson, type Section } from "@/api/lessons";
import { getAllQuizzes, createQuiz, updateQuiz, deleteQuiz, type Quiz, type QuizQuestion } from "@/api/quizzes";
import { getAllSubjects, type Subject } from "@/api/subjects";
import { 
  Plus, 
  Search, 
  BookOpen,
  Award,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Users,
  Upload,
  Link
} from "lucide-react";

const ContentManagement = () => {



  // ...all hooks/state...

  // Place handleDuplicate after all hooks/state, before return
  const handleDuplicate = async (item: Lesson) => {
    try {
      const { id, createdAt, updatedAt, ...rest } = item;
      const curriculum = rest.curriculum ? JSON.parse(JSON.stringify(rest.curriculum)) : undefined;
      const newLesson = {
        ...rest,
        title: rest.title + ' (Copy)',
        curriculum,
      };
      await createLesson(newLesson);
      toast({
        title: 'Lesson duplicated',
        description: `A copy of "${rest.title}" has been created.`,
      });
      await fetchContent();
    } catch (error: any) {
      toast({
        title: 'Error duplicating lesson',
        description: error?.response?.data?.error || error?.message || 'Failed to duplicate lesson',
        variant: 'destructive',
      });
    }
  };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [dbSubjects, setDbSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"lesson" | "quiz">("lesson");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{timestamp: string} | null>(null);
  // Single-item delete dialog
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [singleDeleteType, setSingleDeleteType] = useState<'lesson' | 'quiz'>('lesson');
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
  // Draft delete dialog
  const [showDraftDeleteConfirm, setShowDraftDeleteConfirm] = useState(false);

  // LocalStorage keys for saving progress
  const DRAFT_KEY = 'mindsta_lesson_draft';
  const CURRICULUM_DRAFT_KEY = 'mindsta_curriculum_draft';

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    content: "",
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
    whatYouWillLearn: [] as string[],
    requirements: [] as string[],
    targetAudience: [] as string[],
  });

  const [curriculum, setCurriculum] = useState<Section[]>([]);
  const [curriculumMode, setCurriculumMode] = useState<"simple" | "advanced">("simple");
  const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("url");
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

  const processThumbnailFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file (PNG, JPG, GIF, WebP)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB. Please compress or resize it first.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLessonForm(prev => ({ ...prev, imageUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    lessonId: "",
    title: "",
    description: "",
    passingScore: 70,
    timeLimit: 600, // fixed 10-minute exam
  });

  // Quiz filters for lesson selection
  const [quizFilterGrade, setQuizFilterGrade] = useState<string>("");
  const [quizFilterTerm, setQuizFilterTerm] = useState<string>("");
  const [quizFilterSubject, setQuizFilterSubject] = useState<string>("");

  const createBlankQuestion = (): QuizQuestion => ({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: -1, // force explicit selection
    explanation: "",
  });
  const padToTen = (questions: QuizQuestion[]): QuizQuestion[] => {
    const arr = [...questions];
    while (arr.length < 10) arr.push(createBlankQuestion());
    return arr.slice(0, 10);
  };

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([createBlankQuestion()]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  const isQuestionComplete = (q: QuizQuestion) => {
    const hasAllOptions = Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => o.trim());
    const correctInRange = q.correctAnswer >= 0 && q.correctAnswer < 4;
    return q.question.trim() && q.explanation.trim() && hasAllOptions && correctInRange;
  };
  const completedCount = quizQuestions.filter(isQuestionComplete).length;
  const allTenComplete = quizQuestions.length === 10 && completedCount === 10;

  // Fetch data
  useEffect(() => {
    fetchContent();
    // Check for saved draft on mount
    checkForSavedDraft();
  }, []);

  const checkForSavedDraft = () => {
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        setDraftInfo({ timestamp: draft.timestamp });
        setShowDraftModal(true);
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  };

  // Handle URL parameters for creating lessons/quizzes
  useEffect(() => {
    const createParam = searchParams.get('create');
    if (createParam === 'lesson' || createParam === 'quiz') {
      openCreateDialog(createParam);
      // Clear the URL parameter after opening dialog
      setSearchParams({});
    }
  }, [searchParams]);

  // Auto-save draft every 2 minutes when creating a lesson
  useEffect(() => {
    if (isDialogOpen && dialogMode === "lesson" && !editingId) {
      const autoSaveInterval = setInterval(() => {
        // Only auto-save if there's content
        if (lessonForm.title || lessonForm.description || lessonForm.content || curriculum.length > 0) {
          saveProgressDraft();
        }
      }, 120000); // 2 minutes

      return () => clearInterval(autoSaveInterval);
    }
  }, [isDialogOpen, dialogMode, editingId, lessonForm, curriculum]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [lessonsData, quizzesData, subjectsData] = await Promise.all([
        getAllLessons(),
        getAllQuizzes(),
        getAllSubjects(),
      ]);
      setLessons(lessonsData);
      setQuizzes(quizzesData);
      setDbSubjects(subjectsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save draft to localStorage
  const saveProgressDraft = () => {
    setIsSavingProgress(true);
    try {
      const draft = {
        lessonForm,
        curriculum,
        curriculumMode,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      localStorage.setItem(CURRICULUM_DRAFT_KEY, JSON.stringify(curriculum));
      
      toast({
        title: "Progress Saved",
        description: "Your work has been saved. You can continue later.",
      });
      
      // Trigger a re-render to update the draft badge
      setSelectedTab((prev) => prev);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Load draft from localStorage
  const loadProgressDraft = () => {
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        setLessonForm(draft.lessonForm);
        setCurriculum(draft.curriculum || []);
        setCurriculumMode(draft.curriculumMode || "simple");
        
        toast({
          title: "Draft Loaded",
          description: `Restored from ${new Date(draft.timestamp).toLocaleString()}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading draft:", error);
      return false;
    }
  };

  // Check for saved draft
  const hasSavedDraft = () => {
    try {
      return localStorage.getItem(DRAFT_KEY) !== null;
    } catch {
      return false;
    }
  };

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(CURRICULUM_DRAFT_KEY);
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  };

  // Reset forms
  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      subtitle: "",
      description: "",
      content: "",
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
      whatYouWillLearn: [],
      requirements: [],
      targetAudience: [],
    });
    setCurriculum([]);
    setCurriculumMode("simple");
  };

  const resetQuizForm = () => {
    setQuizForm({
      lessonId: "",
      title: "",
      description: "",
      passingScore: 70,
      timeLimit: 600,
    });
    setQuizQuestions([createBlankQuestion()]);
    setCurrentQuestionIndex(0);
    setQuizFilterGrade("");
    setQuizFilterTerm("");
    setQuizFilterSubject("");
  };

  // Open dialog for creating
  const openCreateDialog = (type: "lesson" | "quiz") => {
    setDialogMode(type);
    setEditingId(null);
    if (type === "lesson") {
      // Check for saved draft
      if (hasSavedDraft()) {
        setShowDraftModal(true);
        return; // Draft modal handles opening isDialogOpen
      } else {
        resetLessonForm();
      }
    } else {
      resetQuizForm();
    }
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (item: Lesson | Quiz, type: "lesson" | "quiz") => {
    setDialogMode(type);
    setEditingId(item.id);
    
    if (type === "lesson") {
      const lesson = item as Lesson;
      const difficultyMap: Record<string, string> = {
        'beginner': 'easy',
        'intermediate': 'medium',
        'advanced': 'hard',
        'easy': 'easy',
        'medium': 'medium',
        'hard': 'hard'
      };
      setLessonForm({
        title: lesson.title,
        subtitle: lesson.subtitle || "",
        description: lesson.description,
        content: lesson.content || "",
        overview: (lesson as any).overview || "",
        subject: lesson.subject,
        grade: lesson.grade,
        term: lesson.term,
        difficulty: difficultyMap[lesson.difficulty] || lesson.difficulty,
        videoUrl: lesson.videoUrl || "",
        imageUrl: lesson.imageUrl || "",
        imageDisplaySize: (lesson as any).imageDisplaySize || "full",
        imageObjectFit: (lesson as any).imageObjectFit || "cover",
        order: lesson.order || 0,
        duration: lesson.duration || 30,
        price: lesson.price || 1200,
        whatYouWillLearn: lesson.whatYouWillLearn || [],
        requirements: lesson.requirements || [],
        targetAudience: lesson.targetAudience || [],
      });
      setCurriculum(lesson.curriculum || []);
      setCurriculumMode("simple");
    } else {
      const quiz = item as Quiz;
      const associatedLesson = lessons.find(l => l.id === quiz.lessonId);
      setQuizForm({
        lessonId: quiz.lessonId,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit || 600,
      });
  setQuizQuestions(padToTen(quiz.questions || []));
  setCurrentQuestionIndex(0);
      // Pre-populate filters based on the associated lesson
      if (associatedLesson) {
        setQuizFilterGrade(associatedLesson.grade);
        setQuizFilterTerm(associatedLesson.term);
        setQuizFilterSubject(associatedLesson.subject);
      }
    }
    setIsDialogOpen(true);
  };

  // Handle lesson submit
  const handleLessonSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    const missingFields = [];
    if (!lessonForm.title) missingFields.push("Title");
    if (!lessonForm.description) missingFields.push("Description");
    if (!lessonForm.content) missingFields.push("Content");
    if (!lessonForm.subject) missingFields.push("Subject");
    if (!lessonForm.grade) missingFields.push("Grade");
    if (!lessonForm.term) missingFields.push("Term");
    if (!lessonForm.difficulty) missingFields.push("Difficulty");

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (lessonForm.title.length < 5) {
      toast({
        title: "Invalid Title",
        description: "Title must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    if (lessonForm.content.length < 50) {
      toast({
        title: "Insufficient Content",
        description: "Please provide more detailed lesson content (at least 50 characters)",
        variant: "destructive",
      });
      return;
    }

    // Validate video URL if provided
    if (lessonForm.videoUrl?.trim()) {
      const url = lessonForm.videoUrl.trim();
      const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(url);
      const isDirect = /^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
      const isEmbed = /youtube(?:-nocookie)?\.com\/embed\//i.test(url);
      if (!isYoutube && !isDirect && !isEmbed) {
        toast({
          title: "Invalid Video URL",
          description: "Please enter a valid YouTube link (e.g. youtube.com/watch?v=...) or a direct video file URL (.mp4, .webm).",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const difficultyMap: Record<string, string> = {
        'easy': 'beginner',
        'medium': 'intermediate',
        'hard': 'advanced'
      };

      const lessonData: any = {
        ...lessonForm,
        difficulty: difficultyMap[lessonForm.difficulty] || lessonForm.difficulty,
        keywords: [],
        learningObjectives: [],
      };

      if (editingId) {
        await updateLesson(editingId, lessonData);
        toast({
          title: "Success",
          description: "Lesson updated successfully",
        });
      } else {
        await createLesson(lessonData);
        toast({
          title: "Success",
          description: "Lesson created successfully",
        });
      }

      await fetchContent();
      setIsDialogOpen(false);
      resetLessonForm();
      clearDraft(); // Clear saved draft after successful submission
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to save lesson",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle quiz submit
  const handleQuizSubmit = async () => {
    if (!quizForm.lessonId || !quizForm.title || !quizForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate questions (exactly 10 complete questions)
    const validQuestions = quizQuestions.filter(q => 
      q.question.trim() && 
      q.options.every(opt => opt.trim()) &&
      q.explanation.trim()
    );
    if (quizQuestions.length !== 10) {
      toast({ title: "Validation Error", description: "Exam must contain exactly 10 questions", variant: "destructive" });
      return;
    }
    if (validQuestions.length !== 10) {
      toast({ title: "Validation Error", description: "Please complete all 10 questions (question, 4 options, explanation, choose correct)", variant: "destructive" });
      return;
    }

    try {
      const quizData = {
        ...quizForm,
        questions: validQuestions,
      };

      if (editingId) {
        await updateQuiz(editingId, quizData);
        toast({
          title: "Success",
          description: "Quiz updated successfully",
        });
      } else {
        await createQuiz(quizData);
        toast({
          title: "Success",
          description: "Quiz created successfully",
        });
      }

      await fetchContent();
      setIsDialogOpen(false);
      resetQuizForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save quiz",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = (id: string, type: "lesson" | "quiz") => {
    setSingleDeleteId(id);
    setSingleDeleteType(type);
    setShowSingleDeleteConfirm(true);
  };

  const confirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    try {
      if (singleDeleteType === "lesson") {
        await deleteLesson(singleDeleteId);
      } else {
        await deleteQuiz(singleDeleteId);
      }
      toast({
        title: "Success",
        description: `${singleDeleteType === "lesson" ? "Lesson" : "Quiz"} deleted successfully`,
      });
      await fetchContent();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${singleDeleteType}`,
        variant: "destructive",
      });
    } finally {
      setSingleDeleteId(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to delete",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedItems).map(async (id) => {
        try {
          // Check if this ID belongs to a quiz or a lesson
          const isQuiz = quizzes.some(q => q.id === id);
          const isLesson = lessons.some(l => l.id === id);
          
          console.log(`Deleting item ${id}: isQuiz=${isQuiz}, isLesson=${isLesson}`);
          
          if (isQuiz) {
            const result = await deleteQuiz(id);
            if (!result) throw new Error(`Failed to delete quiz ${id}`);
            return result;
          } else if (isLesson) {
            const result = await deleteLesson(id);
            if (!result) throw new Error(`Failed to delete lesson ${id}`);
            return result;
          } else {
            throw new Error(`Item ${id} not found in lessons or quizzes`);
          }
        } catch (error) {
          console.error(`Error deleting item ${id}:`, error);
          throw error;
        }
      });

      const results = await Promise.allSettled(deletePromises);
      
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length > 0) {
        console.error('Failed deletions:', failed);
        toast({
          title: "Partial Success",
          description: `Deleted ${succeeded.length} items, but ${failed.length} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Deleted ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} successfully`,
        });
      }

      setSelectedItems(new Set());
      setShowDeleteConfirm(false);
      await fetchContent();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  // Select all items in current view
  const selectAllInView = () => {
    const allIds = filteredContent.map(item => item.id);
    setSelectedItems(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Delete all items in a grade
  const handleDeleteGrade = async (grade: string) => {
    const gradeItems = allContent.filter(item => {
      if (item.type === 'lesson') {
        return (item as Lesson).grade === grade;
      } else {
        return (item as Quiz).lessonGrade === grade;
      }
    });

    if (gradeItems.length === 0) {
      toast({
        title: "No items to delete",
        description: `Grade ${grade} has no content`,
        variant: "destructive",
      });
      return;
    }

    // Select all items in the grade
    const gradeItemIds = new Set(gradeItems.map(item => item.id));
    setSelectedItems(gradeItemIds);
    setShowDeleteConfirm(true);
  };

  // Add question to quiz
  const addQuestion = () => {
    // Only allow adding next question if current is complete
    if (quizQuestions.length >= 10) return;
    if (!isQuestionComplete(quizQuestions[currentQuestionIndex])) return;
    const next = [...quizQuestions, createBlankQuestion()];
    setQuizQuestions(next);
    setCurrentQuestionIndex(next.length - 1);
  };

  // Remove question from quiz
  const removeQuestion = (index: number) => {
    // Restrict removals: allow removing only the last question to avoid gaps
    if (index !== quizQuestions.length - 1) return;
    if (quizQuestions.length <= 1) return;
    const updated = quizQuestions.slice(0, -1);
    setQuizQuestions(updated);
    setCurrentQuestionIndex(updated.length - 1);
  };

  // Update question
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  // Update option
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...quizQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setQuizQuestions(updated);
  };

  // Move question up/down
  const moveQuestion = (index: number, direction: "up" | "down") => {
    // Reordering disabled in step-by-step mode to keep flow simple
    return;
  };

  // Combined content for filtering
  const allContent = [
    ...lessons.map(l => ({ ...l, type: "lesson" as const })),
    ...quizzes.map(q => ({ ...q, type: "quiz" as const })),
  ];

  // Filter content
  const filteredContent = allContent.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.type === "lesson" && (item as Lesson).subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.type === "quiz" && (item as Quiz).lessonTitle?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = selectedTab === "all" || item.type === selectedTab.replace("s", "");
    
    const matchesGrade = 
      filterGrade === "all" || 
      (item.type === "lesson" && (item as Lesson).grade === filterGrade) ||
      (item.type === "quiz" && (item as Quiz).lessonGrade === filterGrade);
    
    const matchesSubject = 
      filterSubject === "all" || 
      (item.type === "lesson" && (item as Lesson).subject === filterSubject) ||
      (item.type === "quiz" && (item as Quiz).lessonSubject === filterSubject);

    return matchesSearch && matchesTab && matchesGrade && matchesSubject;
  });

  // Get unique subjects and grades
  const subjects = dbSubjects.map(s => s.name);
  const grades = Array.from(new Set(lessons.map(l => l.grade))).sort();

  // Filtered lessons for quiz creation based on selected grade, term, and subject
  const filteredLessonsForQuiz = lessons.filter(l => {
    const matchesGrade = !quizFilterGrade || l.grade === quizFilterGrade;
    const matchesTerm = !quizFilterTerm || l.term === quizFilterTerm;
    const matchesSubject = !quizFilterSubject || l.subject === quizFilterSubject;
    return matchesGrade && matchesTerm && matchesSubject;
  });

  // Get subjects available for selected grade and term in quiz creation
  const quizSubjects = Array.from(new Set(
    lessons
      .filter(l => (!quizFilterGrade || l.grade === quizFilterGrade) && (!quizFilterTerm || l.term === quizFilterTerm))
      .map(l => l.subject)
  ));

  // Grouping helpers
  const TERM_ORDER = ["First Term", "Second Term", "Third Term"]; // canonical term labels
  const lessonMatchesFilters = (l: Lesson) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === "all" || l.grade === filterGrade;
    const matchesSubject = filterSubject === "all" || l.subject === filterSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  };
  const lessonsByGradeTerm: Record<string, Record<string, Lesson[]>> = {};
  (lessons.filter(lessonMatchesFilters)).forEach(l => {
    if (!lessonsByGradeTerm[l.grade]) lessonsByGradeTerm[l.grade] = {} as Record<string, Lesson[]>;
    const term = l.term || "Unassigned";
    if (!lessonsByGradeTerm[l.grade][term]) lessonsByGradeTerm[l.grade][term] = [];
    lessonsByGradeTerm[l.grade][term].push(l);
  });

  const lessonById = new Map(lessons.map(l => [l.id, l]));
  const quizMatchesFilters = (q: Quiz) => {
    const term = lessonById.get(q.lessonId)?.term || "";
    const grade = q.lessonGrade || lessonById.get(q.lessonId)?.grade || "";
    const subject = q.lessonSubject || lessonById.get(q.lessonId)?.subject || "";
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || (q.lessonTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === "all" || grade === filterGrade;
    const matchesSubject = filterSubject === "all" || subject === filterSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  };
  const quizzesByGradeTerm: Record<string, Record<string, Quiz[]>> = {};
  (quizzes.filter(quizMatchesFilters)).forEach(q => {
    const l = lessonById.get(q.lessonId);
    const grade = (q.lessonGrade || l?.grade || "").toString();
    const term = l?.term || "Unassigned";
    if (!grade) return;
    if (!quizzesByGradeTerm[grade]) quizzesByGradeTerm[grade] = {} as Record<string, Quiz[]>;
    if (!quizzesByGradeTerm[grade][term]) quizzesByGradeTerm[grade][term] = [];
    quizzesByGradeTerm[grade][term].push(q);
  });

  const contentStats = {
    lessons: lessons.length,
    quizzes: quizzes.length,
    total: lessons.length + quizzes.length,
  };

  return (
    <AdminLayout>
      {isDialogOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-background overflow-auto">
          <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between sticky top-0 bg-background py-4 border-b z-10">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">
                      {editingId ? "Edit" : "Create"} {dialogMode === "lesson" ? "Lesson" : "Quiz"}
                    </h1>
                    {!editingId && hasSavedDraft() && dialogMode === "lesson" && (
                      <Badge variant="secondary" className="gap-1">
                        💾 Draft Saved
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {dialogMode === "lesson" 
                      ? "Fill in the lesson details below"
                      : "Create a quiz for a lesson"}
                  </p>
                  {!editingId && dialogMode === "lesson" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Your progress is auto-saved every 2 minutes. Click "Save Progress" to save manually.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Back to Content
                </Button>
              </div>
              
              {/* Render form inline */}
              {dialogMode === "lesson" ? (
                <div className="w-full">
                  <div className="space-y-4 py-4">
                    {/* Basic Information Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Basic Lesson Information
                        </CardTitle>
                        <CardDescription>
                          Enter the fundamental details about this lesson
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium">
                              Lesson Title *
                            </Label>
                            <Input
                              id="title"
                              value={lessonForm.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              placeholder="e.g., Introduction to Algebra"
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">Give your lesson a clear, descriptive title</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subject" className="text-sm font-medium">
                              Subject *
                            </Label>
                            <Select value={lessonForm.subject} onValueChange={(value) => setLessonForm({ ...lessonForm, subject: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {dbSubjects.length === 0 ? (
                                  <SelectItem value="none" disabled>No subjects available - Create one first</SelectItem>
                                ) : (
                                  dbSubjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Select the academic subject</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="grade" className="text-sm font-medium">
                              Grade Level *
                            </Label>
                            <Select value={lessonForm.grade} onValueChange={(value) => setLessonForm({ ...lessonForm, grade: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6].map((g) => (
                                  <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                                ))}
                                <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="term" className="text-sm font-medium">
                              Academic Term *
                            </Label>
                            <Select value={lessonForm.term} onValueChange={(value) => setLessonForm({ ...lessonForm, term: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Term" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="First Term">First Term</SelectItem>
                                <SelectItem value="Second Term">Second Term</SelectItem>
                                <SelectItem value="Third Term">Third Term</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="difficulty" className="text-sm font-medium">
                              Difficulty Level *
                            </Label>
                            <Select value={lessonForm.difficulty} onValueChange={(value) => setLessonForm({ ...lessonForm, difficulty: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Difficulty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">🟢 Easy</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="hard">🔴 Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="duration" className="text-sm font-medium">
                              Duration (minutes)
                            </Label>
                            <Input
                              id="duration"
                              type="number"
                              min="5"
                              max="300"
                              value={lessonForm.duration}
                              onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 30 })}
                              placeholder="30"
                            />
                            <p className="text-xs text-muted-foreground">⚡ Auto-filled when you paste a video URL below — or set manually</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lesson Content Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Lesson Content & Media</CardTitle>
                        <CardDescription>
                          Add the main educational content and supporting materials
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Brief Description *</Label>
                            <Textarea
                              value={lessonForm.description}
                              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                              placeholder="A short overview that helps students understand what they'll learn..."
                              className="min-h-[100px] resize-y"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Keep it concise - this appears in lesson previews</p>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Course Overview (For Student Preview)</Label>
                            <Textarea
                              value={lessonForm.overview}
                              onChange={(e) => setLessonForm({ ...lessonForm, overview: e.target.value })}
                              placeholder="What will students learn in this course? List key topics, skills, and learning outcomes..."
                              className="min-h-[120px] resize-y"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">This overview helps students decide if this course is right for them before purchasing</p>
                        </div>

                        <div className="space-y-2">
                          <RichTextEditor
                            label="Full Lesson Content *"
                            value={lessonForm.content}
                            onChange={(value) => setLessonForm({ ...lessonForm, content: value })}
                            placeholder="Write your complete lesson content here..."
                            minHeight="400px"
                          />
                          <p className="text-xs text-muted-foreground">💡 Tip: Use the toolbar to format your content with headings, lists, bold, italics, and more</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="videoUrl" className="text-sm font-medium">
                              Video URL (Optional)
                            </Label>
                            <Input
                              id="videoUrl"
                              value={lessonForm.videoUrl}
                              onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                              placeholder="https://youtube.com/watch?v=... or https://..."
                              type="url"
                              className={lessonForm.videoUrl?.trim() && !/(?:youtube\.com|youtu\.be|youtube-nocookie\.com\/embed)/i.test(lessonForm.videoUrl) && !/^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(lessonForm.videoUrl) ? 'border-destructive' : ''}
                            />
                            {lessonForm.videoUrl?.trim() && (
                              /(?:youtube\.com|youtu\.be|youtube-nocookie\.com\/embed)/i.test(lessonForm.videoUrl) ? (
                                <p className="text-xs text-green-600 flex items-center gap-1">✓ Valid YouTube URL</p>
                              ) : /^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(lessonForm.videoUrl) ? (
                                <p className="text-xs text-green-600 flex items-center gap-1">✓ Valid direct video URL</p>
                              ) : (
                                <p className="text-xs text-destructive">⚠ Must be a YouTube link or direct video URL (.mp4, .webm)</p>
                              )
                            )}
                            {!lessonForm.videoUrl?.trim() && (
                              <p className="text-xs text-muted-foreground">YouTube URL or direct video link — leave blank if no video</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="text-sm font-medium">
                              Thumbnail Image (Optional)
                            </Label>
                            {/* Mode toggle */}
                            <div className="flex gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => setThumbnailMode('url')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                  thumbnailMode === 'url'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary'
                                }`}
                              >
                                <Link className="w-3.5 h-3.5" /> Image URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setThumbnailMode('upload')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                  thumbnailMode === 'upload'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" /> Upload File
                              </button>
                            </div>
                            {thumbnailMode === 'url' ? (
                              <Input
                                id="imageUrl"
                                value={lessonForm.imageUrl}
                                onChange={(e) => setLessonForm({ ...lessonForm, imageUrl: e.target.value })}
                                placeholder="https://..."
                                type="url"
                              />
                            ) : (
                              <div
                                onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDraggingThumbnail(false); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDraggingThumbnail(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) processThumbnailFile(file);
                                }}
                                className={`flex items-center justify-center w-full rounded-lg border-2 border-dashed transition-colors ${
                                  isDraggingThumbnail
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-muted/30 hover:bg-muted/60'
                                }`}
                              >
                                <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
                                  <Upload className={`w-7 h-7 mb-2 transition-colors ${isDraggingThumbnail ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {isDraggingThumbnail ? 'Drop image here' : 'Click to upload or drag & drop'}
                                  </p>
                                  <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, GIF, WebP · Max 5MB</p>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) processThumbnailFile(file);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                            {/* Preview */}
                            {lessonForm.imageUrl && (
                              <div className="relative mt-2 rounded-lg overflow-hidden border bg-muted/20" style={{ aspectRatio: '16/9', maxHeight: { full: 300, large: 220, medium: 160, small: 100 }[lessonForm.imageDisplaySize] || 120 }}>
                                <img src={lessonForm.imageUrl} alt="Thumbnail preview" className="w-full h-full" style={{ objectFit: lessonForm.imageObjectFit as any || 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <button
                                  type="button"
                                  onClick={() => setLessonForm({ ...lessonForm, imageUrl: '' })}
                                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {/* Image display size controls */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Display Size</Label>
                                <Select value={lessonForm.imageDisplaySize} onValueChange={(v) => setLessonForm({ ...lessonForm, imageDisplaySize: v })}>
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
                                <Select value={lessonForm.imageObjectFit} onValueChange={(v) => setLessonForm({ ...lessonForm, imageObjectFit: v })}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cover">Cover (fill &amp; crop)</SelectItem>
                                    <SelectItem value="contain">Contain (show full)</SelectItem>
                                    <SelectItem value="fill">Fill (stretch)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Cover image for the lesson card</p>
                          </div>
                        </div>

                        {/* Live video preview — auto-detects duration */}
                        {lessonForm.videoUrl?.trim() && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              📽️ Video Preview
                              <span className="text-xs font-normal text-muted-foreground">(duration auto-filled when video loads)</span>
                            </Label>
                            <VideoPlayer
                              videoUrl={lessonForm.videoUrl}
                              title={lessonForm.title || 'Lesson Preview'}
                              enableDownload={false}
                              onDurationDetected={(mins) =>
                                setLessonForm((prev) => ({ ...prev, duration: mins }))
                              }
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Course Metadata Card - What You'll Learn, Requirements, Target Audience */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Course Details (Shown on Student Overview)
                        </CardTitle>
                        <CardDescription>
                          These appear on the student's subject overview page to help them understand what they'll learn
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* What You Will Learn */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">What Students Will Learn</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              List the key skills and concepts students will gain from this lesson
                            </p>
                          </div>
                          <div className="space-y-2">
                            {lessonForm.whatYouWillLearn.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...lessonForm.whatYouWillLearn];
                                    updated[index] = e.target.value;
                                    setLessonForm({ ...lessonForm, whatYouWillLearn: updated });
                                  }}
                                  placeholder={`Learning outcome ${index + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = lessonForm.whatYouWillLearn.filter((_, i) => i !== index);
                                    setLessonForm({ ...lessonForm, whatYouWillLearn: updated });
                                  }}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2 mt-1"
                              onClick={() => setLessonForm({ ...lessonForm, whatYouWillLearn: [...lessonForm.whatYouWillLearn, ""] })}
                            >
                              <Plus className="w-4 h-4" />
                              Add Learning Outcome
                            </Button>
                          </div>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-3 border-t pt-4">
                          <div>
                            <Label className="text-sm font-medium">Requirements / Prerequisites</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              What should students know or have before starting this lesson?
                            </p>
                          </div>
                          <div className="space-y-2">
                            {lessonForm.requirements.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...lessonForm.requirements];
                                    updated[index] = e.target.value;
                                    setLessonForm({ ...lessonForm, requirements: updated });
                                  }}
                                  placeholder={`Requirement ${index + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = lessonForm.requirements.filter((_, i) => i !== index);
                                    setLessonForm({ ...lessonForm, requirements: updated });
                                  }}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2 mt-1"
                              onClick={() => setLessonForm({ ...lessonForm, requirements: [...lessonForm.requirements, ""] })}
                            >
                              <Plus className="w-4 h-4" />
                              Add Requirement
                            </Button>
                          </div>
                        </div>

                        {/* Target Audience */}
                        <div className="space-y-3 border-t pt-4">
                          <div>
                            <Label className="text-sm font-medium">Who This Lesson Is For</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Describe who will benefit most from this lesson
                            </p>
                          </div>
                          <div className="space-y-2">
                            {lessonForm.targetAudience.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...lessonForm.targetAudience];
                                    updated[index] = e.target.value;
                                    setLessonForm({ ...lessonForm, targetAudience: updated });
                                  }}
                                  placeholder={`Target student ${index + 1}, e.g., "Grade 4 students learning fractions"`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = lessonForm.targetAudience.filter((_, i) => i !== index);
                                    setLessonForm({ ...lessonForm, targetAudience: updated });
                                  }}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2 mt-1"
                              onClick={() => setLessonForm({ ...lessonForm, targetAudience: [...lessonForm.targetAudience, ""] })}
                            >
                              <Plus className="w-4 h-4" />
                              Add Target Audience
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Curriculum Builder Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              📑 Course Curriculum (Optional)
                            </CardTitle>
                            <CardDescription>
                              Add sections and lectures to structure your course content
                            </CardDescription>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setCurriculum([...curriculum, { title: '', description: '', order: curriculum.length + 1, lectures: [] }])}
                          >
                            <Plus className="w-4 h-4" />
                            Add Section
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
                                        value={section.description || ''}
                                        onChange={(e) => {
                                          const updated = [...curriculum];
                                          updated[sIdx] = { ...section, description: e.target.value };
                                          setCurriculum(updated);
                                        }}
                                        placeholder="Section description (optional)"
                                        className="text-sm"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setCurriculum(curriculum.filter((_, i) => i !== sIdx))}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  {/* Lectures */}
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
                                          <SelectTrigger className="w-28 h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
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
                                        updated[sIdx].lectures = [
                                          ...section.lectures,
                                          { title: '', type: 'video', duration: 0, order: section.lectures.length + 1 }
                                        ];
                                        setCurriculum(updated);
                                      }}
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add Lecture
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pricing Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Pricing</CardTitle>
                        <CardDescription>
                          Set the price for this lesson
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price" className="text-sm font-medium">
                              Lesson Price (₦) *
                            </Label>
                            <Input
                              id="price"
                              type="number"
                              min="0"
                              step="100"
                              required
                              value={lessonForm.price}
                              onChange={(e) => setLessonForm({ ...lessonForm, price: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                              className="text-lg"
                            />
                            <p className="text-xs text-muted-foreground">
                              {lessonForm.price === 0 
                                ? "💚 This lesson will be FREE for students" 
                                : `Students will pay ₦${lessonForm.price.toLocaleString()} for this lesson`}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <Button 
                            variant="secondary" 
                            onClick={saveProgressDraft}
                            disabled={isSavingProgress || editingId !== null}
                            className="gap-2"
                          >
                            {isSavingProgress ? "Saving..." : "💾 Save Progress"}
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleLessonSubmit} className="gap-2">
                              <BookOpen className="w-4 h-4" />
                              {editingId ? "Update" : "Create"} Lesson
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Quiz form content */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quizGrade">Grade *</Label>
                        <Select value={quizFilterGrade} onValueChange={(value) => {
                          setQuizFilterGrade(value);
                          setQuizFilterTerm("");
                          setQuizFilterSubject("");
                          setQuizForm({ ...quizForm, lessonId: "" });
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((g) => (
                              <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quizTerm">Term *</Label>
                        <Select 
                          value={quizFilterTerm} 
                          onValueChange={(value) => {
                            setQuizFilterTerm(value);
                            setQuizFilterSubject("");
                            setQuizForm({ ...quizForm, lessonId: "" });
                          }}
                          disabled={!quizFilterGrade}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="First Term">First Term</SelectItem>
                            <SelectItem value="Second Term">Second Term</SelectItem>
                            <SelectItem value="Third Term">Third Term</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quizSubject">Subject *</Label>
                        <Select 
                          value={quizFilterSubject} 
                          onValueChange={(value) => {
                            setQuizFilterSubject(value);
                            setQuizForm({ ...quizForm, lessonId: "" });
                          }}
                          disabled={!quizFilterGrade || !quizFilterTerm}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {quizSubjects.length === 0 ? (
                              <SelectItem value="none" disabled>No subjects available</SelectItem>
                            ) : (
                              quizSubjects.map(subject => (
                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lessonId">Lesson *</Label>
                        <Select 
                          value={quizForm.lessonId} 
                          onValueChange={(value) => setQuizForm({ ...quizForm, lessonId: value })}
                          disabled={!quizFilterGrade || !quizFilterTerm || !quizFilterSubject}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select lesson" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredLessonsForQuiz.length === 0 ? (
                              <SelectItem value="none" disabled>
                                {!quizFilterGrade || !quizFilterTerm || !quizFilterSubject 
                                  ? "Select grade, term, and subject first"
                                  : "No lessons available for selected filters"}
                              </SelectItem>
                            ) : (
                              filteredLessonsForQuiz.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {lesson.title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quizTitle">Quiz Title *</Label>
                        <Input
                          id="quizTitle"
                          value={quizForm.title}
                          onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                          placeholder="Quiz title"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quizDescription">Description *</Label>
                      <Textarea
                        id="quizDescription"
                        value={quizForm.description}
                        onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
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
                          value={quizForm.passingScore}
                          onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Limit</Label>
                        <Input value={"10 minutes (fixed)"} disabled />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Questions</Label>
                          <p className="text-xs text-muted-foreground">Complete each question to unlock the next. Exactly 10 questions are required.</p>
                        </div>
                        <div className="text-sm text-muted-foreground">{completedCount}/10 complete</div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const exists = i < quizQuestions.length;
                          const complete = exists && isQuestionComplete(quizQuestions[i]);
                          const isCurrent = i === currentQuestionIndex;
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={!exists}
                              onClick={() => exists && setCurrentQuestionIndex(i)}
                              className={`w-8 h-8 rounded-full border text-xs font-medium flex items-center justify-center transition ${
                                isCurrent ? 'border-blue-600 text-blue-600' : complete ? 'bg-green-500 text-white border-green-500' : exists ? 'border-muted-foreground/30 text-foreground' : 'border-muted text-muted-foreground opacity-50'
                              }`}
                              title={exists ? (complete ? 'Complete' : 'Incomplete') : 'Locked'}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-full h-2 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all" style={{ width: `${(completedCount/10)*100}%` }} />
                      </div>

                      {(() => {
                        const qIndex = currentQuestionIndex;
                        const question = quizQuestions[qIndex];
                        return (
                          <Card className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-base">Question {qIndex + 1}</Label>
                                <div className="flex items-center gap-2">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} disabled={quizQuestions.length <= 1 || qIndex !== quizQuestions.length - 1}>
                                    <X className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              <Input
                                value={question.question}
                                onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                                placeholder="Enter question"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                      placeholder={`Option ${oIndex + 1}`}
                                    />
                                    <input
                                      type="radio"
                                      name={`correct-${qIndex}`}
                                      checked={question.correctAnswer === oIndex}
                                      onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                                      className="w-4 h-4"
                                    />
                                  </div>
                                ))}
                              </div>
                              <RichTextEditor
                                label="Explanation for the correct answer"
                                value={question.explanation}
                                onChange={(value) => updateQuestion(qIndex, "explanation", value)}
                                placeholder="Explain why this is the correct answer"
                                minHeight="100px"
                              />

                              <div className="flex items-center justify-between pt-2">
                                <Button type="button" variant="outline" onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0}>
                                  Previous
                                </Button>
                                {currentQuestionIndex === quizQuestions.length - 1 ? (
                                  quizQuestions.length < 10 ? (
                                    <Button type="button" onClick={addQuestion} disabled={!isQuestionComplete(question)}>
                                      Add Next Question
                                    </Button>
                                  ) : (
                                    <Button type="button" disabled={!allTenComplete}>
                                      All Questions Added
                                    </Button>
                                  )
                                ) : (
                                  <Button type="button" onClick={() => setCurrentQuestionIndex((i) => Math.min(quizQuestions.length - 1, i + 1))} disabled={!isQuestionComplete(quizQuestions[currentQuestionIndex])}>
                                    Next
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })()}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleQuizSubmit} disabled={!allTenComplete || !quizForm.lessonId || !quizForm.title || !quizForm.description}>
                        {editingId ? "Update" : "Create"} Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {!isDialogOpen && (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Lessons & Quizzes
            </h1>
            <p className="text-muted-foreground mt-2">
              Create engaging lessons and assessments for your students
            </p>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                💡 Tip: Fill in all required fields marked with * to create a lesson
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {hasSavedDraft() && (
              <Button 
                onClick={() => {
                  loadProgressDraft();
                  setDialogMode("lesson");
                  setEditingId(null);
                  setIsDialogOpen(true);
                }}
                variant="secondary"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Continue Draft
              </Button>
            )}
            <Button onClick={() => navigate("/admin/create-lesson")} className="gap-2">
              <Plus className="w-4 h-4" />
              New Lesson
            </Button>
            <Button onClick={() => navigate("/admin/create-quiz")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              New Quiz
            </Button>
          </div>
        </div>

        {/* Content Type Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BookOpen className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contentStats.lessons}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Educational content items
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <Award className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contentStats.quizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assessment tools
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All items
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map(grade => (
                      <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={viewMode} onValueChange={(v: "list" | "grouped") => setViewMode(v)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grouped">Grouped by Grade/Term</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content List / Grouped View */}
        <Card>
          <CardHeader>
            <CardTitle>{viewMode === "grouped" ? "Content by Grade and Term" : "Content Library"}</CardTitle>
            <CardDescription>
              {viewMode === "grouped" 
                ? "Browse lessons and quizzes organized by grade and academic term"
                : `Browse and manage all educational content (${filteredContent.length} items)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Selection Toolbar */}
            <AnimatePresence>
              {selectedItems.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-sm">
                        {selectedItems.size}
                      </div>
                      <span className="font-medium">
                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-muted-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllInView}
                      className="text-indigo-600 dark:text-indigo-400"
                    >
                      Select All Visible
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-2"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Content ({contentStats.total})</TabsTrigger>
                <TabsTrigger value="lessons">Lessons ({contentStats.lessons})</TabsTrigger>
                <TabsTrigger value="quizzes">Quizzes ({contentStats.quizzes})</TabsTrigger>
                <TabsTrigger value="drafts">
                  Drafts {hasSavedDraft() && <Badge variant="secondary" className="ml-2">1</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* Drafts Tab Content */}
              <TabsContent value="drafts">
                {hasSavedDraft() ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Drafts</CardTitle>
                      <CardDescription>Resume your work on unfinished lessons</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        try {
                          const draftStr = localStorage.getItem(DRAFT_KEY);
                          if (!draftStr) return null;
                          const draft = JSON.parse(draftStr);
                          const timestamp = new Date(draft.timestamp);
                          
                          return (
                            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="gap-1">
                                      <BookOpen className="w-3 h-3" />
                                      Lesson Draft
                                    </Badge>
                                    <Badge variant="secondary">
                                      Simple Lesson
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold text-lg mb-1">
                                    {draft.lessonForm.title || "Untitled Lesson"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {draft.lessonForm.description || "No description"}
                                  </p>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {draft.lessonForm.subject && (
                                      <span className="flex items-center gap-1">
                                        📚 {draft.lessonForm.subject}
                                      </span>
                                    )}
                                    {draft.lessonForm.grade && (
                                      <span className="flex items-center gap-1">
                                        🎓 Grade {draft.lessonForm.grade}
                                      </span>
                                    )}
                                    {draft.lessonForm.term && (
                                      <span className="flex items-center gap-1">
                                        📅 {draft.lessonForm.term}
                                      </span>
                                    )}
                                    {draft.curriculum && draft.curriculum.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        📑 {draft.curriculum.length} section{draft.curriculum.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-3">
                                    💾 Saved on {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      loadProgressDraft();
                                      setDialogMode("lesson");
                                      setEditingId(null);
                                      setIsDialogOpen(true);
                                    }}
                                    className="gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Continue Editing
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDraftDeleteConfirm(true)}
                                    className="gap-2 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Draft
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (error) {
                          console.error("Error loading draft:", error);
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>Error loading draft. The draft may be corrupted.</p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                  clearDraft();
                                  toast({
                                    title: "Draft Cleared",
                                    description: "The corrupted draft has been removed.",
                                  });
                                }}
                              >
                                Clear Draft
                              </Button>
                            </div>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <BookOpen className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No Drafts</h3>
                    <p className="text-sm mb-4">
                      You don't have any saved drafts yet. Start creating a lesson and use "Save Progress" to save your work.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => openCreateDialog("lesson")}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Lesson
                    </Button>
                  </div>
                )}
              </TabsContent>

              {viewMode === "list" ? (
                <TabsContent value={selectedTab}>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Loading content...</p>
                    </div>
                  ) : filteredContent.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No content found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => openCreateDialog("lesson")}
                      >
                        Create Your First Lesson
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject/Lesson</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContent.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge variant="outline" className="gap-1">
                                  {item.type === "lesson" ? (
                                    <><BookOpen className="w-3 h-3" /> Lesson</>
                                  ) : (
                                    <><Award className="w-3 h-3" /> Quiz</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                {item.type === "lesson" 
                                  ? (item as Lesson).subject 
                                  : (item as Quiz).lessonTitle || "N/A"}
                              </TableCell>
                              <TableCell>
                                Grade {item.type === "lesson" 
                                  ? (item as Lesson).grade 
                                  : (item as Quiz).lessonGrade || "N/A"}
                              </TableCell>
                              <TableCell>
                                {item.type === "lesson" ? (
                                  <div className="flex gap-2">
                                    <Badge variant="secondary">
                                      {(item as Lesson).difficulty}
                                    </Badge>
                                    <Badge variant="outline">
                                      {(item as Lesson).term || 'Unassigned'}
                                    </Badge>
                                    {(item as Lesson).videoUrl && (
                                      <Badge variant="outline">Video</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Badge variant="secondary">
                                      {(item as Quiz).questions?.length || 0} Questions
                                    </Badge>
                                    <Badge variant="outline">
                                      {(item as Quiz).passingScore}% Pass
                                    </Badge>
                                    <Badge variant="outline">
                                      {lessonById.get((item as Quiz).lessonId)?.term || 'Unassigned'}
                                    </Badge>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openEditDialog(item, item.type)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  {item.type === "lesson" && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDuplicate(item as Lesson)}
                                    >
                                      <span title="Duplicate">📄</span>
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDelete(item.id, item.type)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ) : (
                // Grouped View by Grade and Term
                <TabsContent value={selectedTab}>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Loading content...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(filterGrade === 'all' ? grades : [filterGrade]).map((grade) => {
                        // Count total items in this grade
                        const gradeItemsCount = allContent.filter(item => {
                          if (item.type === 'lesson') {
                            return (item as Lesson).grade === grade;
                          } else {
                            return (item as Quiz).lessonGrade === grade;
                          }
                        }).length;

                        return (
                        <Card key={grade} className="border-muted">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Grade {grade}</CardTitle>
                                <CardDescription>
                                  {selectedTab === 'quizzes' 
                                    ? 'Quizzes grouped by academic term'
                                    : 'Lessons grouped by academic term'}
                                </CardDescription>
                              </div>
                              {gradeItemsCount > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteGrade(grade)}
                                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete All ({gradeItemsCount})
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                              {(TERM_ORDER).map((term) => {
                                const lessonList = (lessonsByGradeTerm[grade]?.[term] || []) as Lesson[];
                                const quizList = (quizzesByGradeTerm[grade]?.[term] || []) as Quiz[];
                                const items = selectedTab === 'quizzes' ? quizList : selectedTab === 'lessons' ? lessonList : [...lessonList, ...quizList];
                                return (
                                  <Card key={`${grade}-${term}`} className="">
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{term}</CardTitle>
                                        <Badge variant="secondary">{items.length}</Badge>
                                      </div>
                                      <CardDescription>
                                        {selectedTab === 'quizzes' ? 'Quizzes' : selectedTab === 'lessons' ? 'Lessons' : 'Lessons & Quizzes'}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      {items.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No content</p>
                                      ) : (
                                        <div className="space-y-3">
                                          {selectedTab === 'quizzes' ? quizList.map((item) => {
                                            const isSelected = selectedItems.has(item.id);
                                            return (
                                              <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className={`flex items-start gap-3 border rounded-md p-3 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-gray-300'}`}
                                              >
                                                <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item.id)} className="mt-1" />
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="gap-1"><Award className="w-3 h-3" /> Quiz</Badge>
                                                    <span className="font-medium truncate max-w-[20rem]">{item.title}</span>
                                                  </div>
                                                  <div className="text-xs text-muted-foreground mt-1 truncate max-w-[24rem]">
                                                    Lesson: {item.lessonTitle || 'N/A'} • {item.questions?.length || 0} questions • Pass {item.passingScore}%
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(item as any, 'quiz')}><Edit className="w-4 h-4" /></Button>
                                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id as string, 'quiz')}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                                </div>
                                              </motion.div>
                                            );
                                          }) : (() => {
                                            // Group lessons by subject for 'lessons' and 'all' tabs
                                            const groups: { subject: string; lessons: Lesson[] }[] = [];
                                            lessonList.forEach(l => {
                                              const subj = l.subject || 'Other';
                                              const existing = groups.find(g => g.subject === subj);
                                              if (existing) existing.lessons.push(l);
                                              else groups.push({ subject: subj, lessons: [l] });
                                            });
                                            return (
                                              <>
                                                {groups.map(({ subject, lessons }) => (
                                                  <div key={subject} className="space-y-2">
                                                    <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 rounded-md">
                                                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                                      <span className="text-xs font-semibold">{subject}</span>
                                                      <Badge variant="secondary" className="ml-auto text-xs">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</Badge>
                                                    </div>
                                                    {lessons.map((item) => {
                                                      const isSelected = selectedItems.has(item.id);
                                                      return (
                                                        <motion.div
                                                          key={item.id}
                                                          initial={{ opacity: 0, y: 10 }}
                                                          animate={{ opacity: 1, y: 0 }}
                                                          exit={{ opacity: 0, x: -20 }}
                                                          className={`flex items-start gap-3 border rounded-md p-3 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-gray-300'}`}
                                                        >
                                                          <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item.id)} className="mt-1" />
                                                          <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                              <Badge variant="outline" className="gap-1"><BookOpen className="w-3 h-3" /> Lesson</Badge>
                                                              <span className="font-medium truncate max-w-[20rem]">{item.title}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[24rem]">
                                                              Difficulty: {item.difficulty}
                                                            </div>
                                                          </div>
                                                          <div className="flex items-center gap-1 flex-shrink-0">
                                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item as any, 'lesson')}><Edit className="w-4 h-4" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(item)}><span title="Duplicate">📄</span></Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id as string, 'lesson')}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                                          </div>
                                                        </motion.div>
                                                      );
                                                    })}
                                                  </div>
                                                ))}
                                                {selectedTab === 'all' && quizList.map((item) => {
                                                  const isSelected = selectedItems.has(item.id);
                                                  return (
                                                    <motion.div
                                                      key={item.id}
                                                      initial={{ opacity: 0, y: 10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      exit={{ opacity: 0, x: -20 }}
                                                      className={`flex items-start gap-3 border rounded-md p-3 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-gray-300'}`}
                                                    >
                                                      <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item.id)} className="mt-1" />
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                          <Badge variant="outline" className="gap-1"><Award className="w-3 h-3" /> Quiz</Badge>
                                                          <span className="font-medium truncate max-w-[20rem]">{item.title}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[24rem]">
                                                          Lesson: {item.lessonTitle || 'N/A'} • {item.questions?.length || 0} questions • Pass {item.passingScore}%
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-1 flex-shrink-0">
                                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item as any, 'quiz')}><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id as string, 'quiz')}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                                      </div>
                                                    </motion.div>
                                                  );
                                                })}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );})}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Hidden Dialog - content rendered inline above when isDialogOpen=true */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit" : "Create"} {dialogMode === "lesson" ? "Lesson" : "Quiz"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "lesson" 
                  ? "Fill in the lesson details below"
                  : "Create a quiz for a lesson"}
              </DialogDescription>
            </DialogHeader>

            {dialogMode === "lesson" ? (
              <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        placeholder="Lesson title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select value={lessonForm.subject} onValueChange={(value) => setLessonForm({ ...lessonForm, subject: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {dbSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade *</Label>
                      <Select value={lessonForm.grade} onValueChange={(value) => setLessonForm({ ...lessonForm, grade: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((g) => (
                            <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="term">Term *</Label>
                      <Select value={lessonForm.term} onValueChange={(value) => setLessonForm({ ...lessonForm, term: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="First Term">First Term</SelectItem>
                          <SelectItem value="Second Term">Second Term</SelectItem>
                          <SelectItem value="Third Term">Third Term</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty *</Label>
                      <Select value={lessonForm.difficulty} onValueChange={(value) => setLessonForm({ ...lessonForm, difficulty: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (min)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={lessonForm.duration}
                        onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        required
                        value={lessonForm.price}
                        onChange={(e) => setLessonForm({ ...lessonForm, price: parseInt(e.target.value) || 0 })}
                        placeholder="Enter price in Naira"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <RichTextEditor
                      label="Description *"
                      value={lessonForm.description}
                      onChange={(value) => setLessonForm({ ...lessonForm, description: value })}
                      placeholder="Brief description of the lesson"
                      minHeight="120px"
                    />
                  </div>

                  <div className="space-y-2">
                    <RichTextEditor
                      label="Content * (Markdown supported)"
                      value={lessonForm.content}
                      onChange={(value) => setLessonForm({ ...lessonForm, content: value })}
                      placeholder="Write your lesson content here..."
                      minHeight="300px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                    <Input
                      id="videoUrl"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/embed/..."
                    />
                  </div>

                  {/* What You'll Learn / Requirements / Target Audience */}
                  <div className="space-y-4 border rounded-lg p-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Course Details (Shown on Student Overview)
                    </h4>
                    <div className="space-y-2">
                      <Label className="text-sm">What Students Will Learn</Label>
                      {lessonForm.whatYouWillLearn.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={item} onChange={(e) => { const u = [...lessonForm.whatYouWillLearn]; u[index] = e.target.value; setLessonForm({ ...lessonForm, whatYouWillLearn: u }); }} placeholder={`Learning outcome ${index + 1}`} className="flex-1" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => { const u = lessonForm.whatYouWillLearn.filter((_, i) => i !== index); setLessonForm({ ...lessonForm, whatYouWillLearn: u }); }}><X className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setLessonForm({ ...lessonForm, whatYouWillLearn: [...lessonForm.whatYouWillLearn, ""] })}><Plus className="w-4 h-4" /> Add</Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Requirements / Prerequisites</Label>
                      {lessonForm.requirements.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={item} onChange={(e) => { const u = [...lessonForm.requirements]; u[index] = e.target.value; setLessonForm({ ...lessonForm, requirements: u }); }} placeholder={`Requirement ${index + 1}`} className="flex-1" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => { const u = lessonForm.requirements.filter((_, i) => i !== index); setLessonForm({ ...lessonForm, requirements: u }); }}><X className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setLessonForm({ ...lessonForm, requirements: [...lessonForm.requirements, ""] })}><Plus className="w-4 h-4" /> Add</Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Who This Lesson Is For</Label>
                      {lessonForm.targetAudience.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={item} onChange={(e) => { const u = [...lessonForm.targetAudience]; u[index] = e.target.value; setLessonForm({ ...lessonForm, targetAudience: u }); }} placeholder={`Target student ${index + 1}`} className="flex-1" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => { const u = lessonForm.targetAudience.filter((_, i) => i !== index); setLessonForm({ ...lessonForm, targetAudience: u }); }}><X className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setLessonForm({ ...lessonForm, targetAudience: [...lessonForm.targetAudience, ""] })}><Plus className="w-4 h-4" /> Add</Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleLessonSubmit}>
                      {editingId ? "Update" : "Create"} Lesson
                    </Button>
                  </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quizGrade">Grade *</Label>
                    <Select value={quizFilterGrade} onValueChange={(value) => {
                      setQuizFilterGrade(value);
                      setQuizFilterTerm("");
                      setQuizFilterSubject("");
                      setQuizForm({ ...quizForm, lessonId: "" });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quizTerm">Term *</Label>
                    <Select 
                      value={quizFilterTerm} 
                      onValueChange={(value) => {
                        setQuizFilterTerm(value);
                        setQuizFilterSubject("");
                        setQuizForm({ ...quizForm, lessonId: "" });
                      }}
                      disabled={!quizFilterGrade}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term">First Term</SelectItem>
                        <SelectItem value="Second Term">Second Term</SelectItem>
                        <SelectItem value="Third Term">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quizSubject">Subject *</Label>
                    <Select 
                      value={quizFilterSubject} 
                      onValueChange={(value) => {
                        setQuizFilterSubject(value);
                        setQuizForm({ ...quizForm, lessonId: "" });
                      }}
                      disabled={!quizFilterGrade || !quizFilterTerm}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {quizSubjects.length === 0 ? (
                          <SelectItem value="none" disabled>No subjects available</SelectItem>
                        ) : (
                          quizSubjects.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lessonId">Lesson *</Label>
                    <Select 
                      value={quizForm.lessonId} 
                      onValueChange={(value) => setQuizForm({ ...quizForm, lessonId: value })}
                      disabled={!quizFilterGrade || !quizFilterTerm || !quizFilterSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lesson" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLessonsForQuiz.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {!quizFilterGrade || !quizFilterTerm || !quizFilterSubject 
                              ? "Select grade, term, and subject first"
                              : "No lessons available for selected filters"}
                          </SelectItem>
                        ) : (
                          filteredLessonsForQuiz.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              {lesson.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quizTitle">Quiz Title *</Label>
                    <Input
                      id="quizTitle"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      placeholder="Quiz title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quizDescription">Description *</Label>
                  <Textarea
                    id="quizDescription"
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
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
                      value={quizForm.passingScore}
                      onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Limit</Label>
                    <Input value={"10 minutes (fixed)"} disabled />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Questions</Label>
                      <p className="text-xs text-muted-foreground">Complete each question to unlock the next. Exactly 10 questions are required.</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{completedCount}/10 complete</div>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const exists = i < quizQuestions.length;
                      const complete = exists && isQuestionComplete(quizQuestions[i]);
                      const isCurrent = i === currentQuestionIndex;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!exists}
                          onClick={() => exists && setCurrentQuestionIndex(i)}
                          className={`w-8 h-8 rounded-full border text-xs font-medium flex items-center justify-center transition ${
                            isCurrent ? 'border-blue-600 text-blue-600' : complete ? 'bg-green-500 text-white border-green-500' : exists ? 'border-muted-foreground/30 text-foreground' : 'border-muted text-muted-foreground opacity-50'
                          }`}
                          title={exists ? (complete ? 'Complete' : 'Incomplete') : 'Locked'}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${(completedCount/10)*100}%` }} />
                  </div>

                  {/* Current question editor */}
                  {(() => {
                    const qIndex = currentQuestionIndex;
                    const question = quizQuestions[qIndex];
                    return (
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base">Question {qIndex + 1}</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} disabled={quizQuestions.length <= 1 || qIndex !== quizQuestions.length - 1}>
                                <X className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                            placeholder="Enter question"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={question.correctAnswer === oIndex}
                                  onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                                  className="w-4 h-4"
                                />
                              </div>
                            ))}
                          </div>
                          <Textarea
                            value={question.explanation}
                            onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                            placeholder="Explanation for the correct answer"
                            rows={2}
                          />

                          <div className="flex items-center justify-between pt-2">
                            <Button type="button" variant="outline" onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0}>
                              Previous
                            </Button>
                            {currentQuestionIndex === quizQuestions.length - 1 ? (
                              quizQuestions.length < 10 ? (
                                <Button type="button" onClick={addQuestion} disabled={!isQuestionComplete(question)}>
                                  Add Next Question
                                </Button>
                              ) : (
                                <Button type="button" disabled={!allTenComplete} onClick={() => { /* noop, submit button below */ }}>
                                  All Questions Added
                                </Button>
                              )
                            ) : (
                              <Button type="button" onClick={() => setCurrentQuestionIndex((i) => Math.min(quizQuestions.length - 1, i + 1))} disabled={!isQuestionComplete(quizQuestions[currentQuestionIndex])}>
                                Next
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleQuizSubmit} disabled={!allTenComplete || !quizForm.lessonId || !quizForm.title || !quizForm.description}>
                    {editingId ? "Update" : "Create"} Quiz
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                Confirm Bulk Delete
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedItems.size} selected item{selectedItems.size !== 1 ? 's' : ''}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground mb-2">Items to be deleted:</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center font-semibold text-sm">
                    {selectedItems.size}
                  </div>
                  <span className="font-medium">
                    {selectedItems.size} content item{selectedItems.size !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Saved Draft Modal */}
        <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <DialogTitle className="text-xl">Continue from where you left off?</DialogTitle>
                  <DialogDescription className="mt-1">
                    You have unsaved work from a previous session
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground mb-1">Draft Information</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Last saved:</span>{' '}
                        {draftInfo?.timestamp && new Date(draftInfo.timestamp).toLocaleString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs">
                        Your progress was automatically saved. You can continue editing or start fresh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 bg-card">
                  <div className="font-semibold text-sm mb-1">Continue Editing</div>
                  <p className="text-xs text-muted-foreground">
                    Load your saved progress and continue where you left off
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-card">
                  <div className="font-semibold text-sm mb-1">Start Fresh</div>
                  <p className="text-xs text-muted-foreground">
                    Discard the draft and begin with a clean slate
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearDraft();
                  setShowDraftModal(false);
                  toast({
                    title: 'Draft Discarded',
                    description: 'Starting with a clean slate',
                  });
                }}
                className="gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Start Fresh
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const loaded = loadProgressDraft();
                  if (loaded) {
                    setShowDraftModal(false);
                    // Open the lesson dialog to show the loaded content
                    setIsDialogOpen(true);
                    setDialogMode('lesson');
                  }
                }}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Continue Editing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      )}

      {/* Single-item Delete Confirmation */}
      <ConfirmDialog
        open={showSingleDeleteConfirm}
        onOpenChange={setShowSingleDeleteConfirm}
        onConfirm={confirmSingleDelete}
        title={`Delete ${singleDeleteType === 'lesson' ? 'Lesson' : 'Quiz'}`}
        description={`Are you sure you want to delete this ${singleDeleteType}? This action cannot be undone.`}
        confirmText={`Delete ${singleDeleteType === 'lesson' ? 'Lesson' : 'Quiz'}`}
        destructive
      />

      {/* Draft Delete Confirmation */}
      <ConfirmDialog
        open={showDraftDeleteConfirm}
        onOpenChange={setShowDraftDeleteConfirm}
        onConfirm={() => {
          clearDraft();
          toast({ title: "Draft Deleted", description: "The saved draft has been removed." });
          setSelectedTab("all");
        }}
        title="Delete Draft"
        description="Are you sure you want to delete this draft? This action cannot be undone."
        confirmText="Delete Draft"
        destructive
      />
    </AdminLayout>
  );
};

export default ContentManagement;
