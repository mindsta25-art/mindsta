import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { CurriculumBuilder } from "@/components/CurriculumBuilder";
import { useToast } from "@/hooks/use-toast";
import { getAllLessons, createLesson, updateLesson, deleteLesson, type Lesson, type Section } from "@/api/lessons";
import { getAllQuizzes, createQuiz, updateQuiz, deleteQuiz, type Quiz, type QuizQuestion } from "@/api/quizzes";
import { 
  Plus, 
  Search, 
  BookOpen,
  Award,
  Edit,
  Trash2,
  X,
  AlertTriangle
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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

  // LocalStorage keys for saving progress
  const DRAFT_KEY = 'mindsta_lesson_draft';
  const CURRICULUM_DRAFT_KEY = 'mindsta_curriculum_draft';

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    content: "",
    subject: "",
    grade: "",
    term: "",
    difficulty: "",
    videoUrl: "",
    imageUrl: "",
    order: 0,
    duration: 30,
    price: 0,
    whatYouWillLearn: [] as string[],
    requirements: [] as string[],
    targetAudience: [] as string[],
  });

  // Curriculum state for Udemy-style structure
  const [curriculum, setCurriculum] = useState<Section[]>([]);
  const [curriculumMode, setCurriculumMode] = useState<"simple" | "advanced">("simple");

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
  }, []);

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
      const [lessonsData, quizzesData] = await Promise.all([
        getAllLessons(),
        getAllQuizzes(),
      ]);
      setLessons(lessonsData);
      setQuizzes(quizzesData);
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
      subject: "",
      grade: "",
      term: "",
      difficulty: "",
      videoUrl: "",
      imageUrl: "",
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
        const shouldLoad = window.confirm(
          "You have a saved draft. Do you want to continue from where you left off?"
        );
        if (shouldLoad) {
          loadProgressDraft();
        } else {
          resetLessonForm();
          clearDraft();
        }
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
        subject: lesson.subject,
        grade: lesson.grade,
        term: lesson.term,
        difficulty: difficultyMap[lesson.difficulty] || lesson.difficulty,
        videoUrl: lesson.videoUrl || "",
        imageUrl: lesson.imageUrl || "",
        order: lesson.order || 0,
        duration: lesson.duration || 30,
        price: lesson.price || 1200,
        whatYouWillLearn: lesson.whatYouWillLearn || [],
        requirements: lesson.requirements || [],
        targetAudience: lesson.targetAudience || [],
      });
      setCurriculum(lesson.curriculum || []);
      setCurriculumMode(lesson.curriculum && lesson.curriculum.length > 0 ? "advanced" : "simple");
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
    // Validate based on mode
    if (curriculumMode === "simple") {
      if (!lessonForm.title || !lessonForm.description || !lessonForm.content || 
          !lessonForm.subject || !lessonForm.grade || !lessonForm.term || !lessonForm.difficulty) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (including term)",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!lessonForm.title || !lessonForm.description || 
          !lessonForm.subject || !lessonForm.grade || !lessonForm.term || !lessonForm.difficulty) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      if (curriculum.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one section to your curriculum",
          variant: "destructive",
        });
        return;
      }
    }

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

      // Add curriculum if in advanced mode
      if (curriculumMode === "advanced") {
        lessonData.curriculum = curriculum;
        // Calculate total duration from curriculum
        const totalDuration = curriculum.reduce((sum, section) => 
          sum + section.lectures.reduce((lectureSum, lecture) => lectureSum + (lecture.duration || 0), 0), 
        0);
        lessonData.duration = totalDuration;
      }

      console.log('Submitting lesson data:', lessonData);
      console.log('Mode:', curriculumMode);

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
  const handleDelete = async (id: string, type: "lesson" | "quiz") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      if (type === "lesson") {
        await deleteLesson(id);
      } else {
        await deleteQuiz(id);
      }

      toast({
        title: "Success",
        description: `${type === "lesson" ? "Lesson" : "Quiz"} deleted successfully`,
      });

      await fetchContent();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${type}`,
        variant: "destructive",
      });
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
  const subjects = Array.from(new Set(lessons.map(l => l.subject)));
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
                <Tabs value={curriculumMode} onValueChange={(v: "simple" | "advanced") => setCurriculumMode(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">Simple Lesson</TabsTrigger>
                    <TabsTrigger value="advanced">Course with Curriculum</TabsTrigger>
                  </TabsList>

                  <TabsContent value="simple" className="space-y-4 py-4">
                    <Card>
                      <CardContent className="pt-6 space-y-4">
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
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                                <SelectItem value="Social Studies">Social Studies</SelectItem>
                                <SelectItem value="Arts & Crafts">Arts & Crafts</SelectItem>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                            placeholder="Brief description of the lesson"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="content">Content * (Markdown supported)</Label>
                          <Textarea
                            id="content"
                            value={lessonForm.content}
                            onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                            placeholder="# Lesson Content&#10;&#10;Write your lesson content here..."
                            rows={12}
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

                        <div className="flex justify-between items-center pt-4">
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
                            <Button onClick={handleLessonSubmit}>
                              {editingId ? "Update" : "Create"} Lesson
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 py-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title-adv">Course Title *</Label>
                            <Input
                              id="title-adv"
                              value={lessonForm.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              placeholder="e.g., Complete Introduction to Algebra"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subtitle">Course Subtitle</Label>
                            <Input
                              id="subtitle"
                              value={lessonForm.subtitle}
                              onChange={(e) => setLessonForm({ ...lessonForm, subtitle: e.target.value })}
                              placeholder="Short tagline for your course"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="grade-adv">Grade *</Label>
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
                            <Label htmlFor="term-adv">Term *</Label>
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
                            <Label htmlFor="subject-adv">Subject *</Label>
                            <Select value={lessonForm.subject} onValueChange={(value) => setLessonForm({ ...lessonForm, subject: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                                <SelectItem value="Social Studies">Social Studies</SelectItem>
                                <SelectItem value="Arts & Crafts">Arts & Crafts</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="difficulty-adv">Difficulty *</Label>
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description-adv">Course Description *</Label>
                          <Textarea
                            id="description-adv"
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                            placeholder="Comprehensive description of what this course covers..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="imageUrl">Course Thumbnail URL</Label>
                          <Input
                            id="imageUrl"
                            value={lessonForm.imageUrl}
                            onChange={(e) => setLessonForm({ ...lessonForm, imageUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="price-adv">Course Price (₦) *</Label>
                          <Input
                            id="price-adv"
                            type="number"
                            min="0"
                            required
                            value={lessonForm.price}
                            onChange={(e) => setLessonForm({ ...lessonForm, price: parseInt(e.target.value) || 0 })}
                            placeholder="Enter price in Naira"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Curriculum</CardTitle>
                        <CardDescription>Build your course structure with sections and lectures</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CurriculumBuilder curriculum={curriculum} onChange={setCurriculum} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
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
                            <Button onClick={handleLessonSubmit}>
                              {editingId ? "Update" : "Create"} Course
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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
            <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage lessons and quizzes
            </p>
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
            <Button onClick={() => openCreateDialog("lesson")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Lesson
            </Button>
            <Button onClick={() => openCreateDialog("quiz")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Quiz
            </Button>
          </div>
        </div>

        {/* Content Type Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats.lessons}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Educational content
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats.quizzes}</div>
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
                                      {draft.curriculumMode === "advanced" ? "Advanced Course" : "Simple Lesson"}
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
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to delete this draft? This action cannot be undone.")) {
                                        clearDraft();
                                        toast({
                                          title: "Draft Deleted",
                                          description: "The saved draft has been removed.",
                                        });
                                        setSelectedTab("all");
                                      }
                                    }}
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
                                          {items.map((item) => {
                                            const isSelected = selectedItems.has(item.id);
                                            return (
                                            <motion.div
                                              key={item.id}
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0, x: -20 }}
                                              className={`flex items-start gap-3 border rounded-md p-3 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-gray-300'}`}
                                            >
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleItemSelection(item.id)}
                                                className="mt-1"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="outline" className="gap-1">
                                                    {('type' in item ? (item as any).type : (item as any).questions ? 'quiz' : 'lesson') === 'lesson' ? (
                                                      <><BookOpen className="w-3 h-3" /> Lesson</>
                                                    ) : (
                                                      <><Award className="w-3 h-3" /> Quiz</>
                                                    )}
                                                  </Badge>
                                                  <span className="font-medium truncate max-w-[20rem]">{(item as any).title}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[24rem]">
                                                  {selectedTab === 'quizzes' ? (
                                                    <>
                                                      Lesson: {(item as Quiz).lessonTitle || 'N/A'} • {(item as Quiz).questions?.length || 0} questions • Pass {(item as Quiz).passingScore}%
                                                    </>
                                                  ) : (
                                                    <>
                                                      Subject: {(item as Lesson).subject} • Difficulty: {(item as Lesson).difficulty}
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(item as any, (selectedTab === 'quizzes' ? 'quiz' : 'lesson') as any)}>
                                                  <Edit className="w-4 h-4" />
                                                </Button>
                                                {((selectedTab === 'lessons' || selectedTab === 'all') && (item as any).type === 'lesson') && (
                                                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(item as Lesson)}>
                                                    <span title="Duplicate">📄</span>
                                                  </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id as string, (selectedTab === 'quizzes' ? 'quiz' : 'lesson') as any)}>
                                                  <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                              </div>
                                            </motion.div>
                                          )})}
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
              <Tabs value={curriculumMode} onValueChange={(v: "simple" | "advanced") => setCurriculumMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simple">Simple Lesson</TabsTrigger>
                  <TabsTrigger value="advanced">Course with Curriculum</TabsTrigger>
                </TabsList>

                <TabsContent value="simple" className="space-y-4 py-4">
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
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Social Studies">Social Studies</SelectItem>
                          <SelectItem value="Arts & Crafts">Arts & Crafts</SelectItem>
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
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                      placeholder="Brief description of the lesson"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content * (Markdown supported)</Label>
                    <Textarea
                      id="content"
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      placeholder="# Lesson Content&#10;&#10;Write your lesson content here..."
                      rows={8}
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

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleLessonSubmit}>
                      {editingId ? "Update" : "Create"} Lesson
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 py-4">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title-adv">Course Title *</Label>
                          <Input
                            id="title-adv"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            placeholder="e.g., Complete Introduction to Algebra"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subtitle">Course Subtitle</Label>
                          <Input
                            id="subtitle"
                            value={lessonForm.subtitle}
                            onChange={(e) => setLessonForm({ ...lessonForm, subtitle: e.target.value })}
                            placeholder="Short tagline for your course"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="grade-adv">Grade *</Label>
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
                          <Label htmlFor="term-adv">Term *</Label>
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
                          <Label htmlFor="subject-adv">Subject *</Label>
                          <Select value={lessonForm.subject} onValueChange={(value) => setLessonForm({ ...lessonForm, subject: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mathematics">Mathematics</SelectItem>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="Social Studies">Social Studies</SelectItem>
                              <SelectItem value="Arts & Crafts">Arts & Crafts</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="difficulty-adv">Difficulty *</Label>
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description-adv">Course Description *</Label>
                        <Textarea
                          id="description-adv"
                          value={lessonForm.description}
                          onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                          placeholder="Comprehensive description of what this course covers..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">Course Thumbnail URL</Label>
                        <Input
                          id="imageUrl"
                          value={lessonForm.imageUrl}
                          onChange={(e) => setLessonForm({ ...lessonForm, imageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Curriculum Builder */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Curriculum </CardTitle>
                      <CardDescription>Build your course structure with sections and lectures</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CurriculumBuilder curriculum={curriculum} onChange={setCurriculum} />
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleLessonSubmit}>
                      {editingId ? "Update" : "Create"} Course
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
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
      </div>
      )}
    </AdminLayout>
  );
};

export default ContentManagement;
