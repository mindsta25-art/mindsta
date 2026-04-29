import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getCommonExams,
  deleteCommonExam,
  toggleCommonExamPublish,
  type CommonExam,
} from "@/api/commonEntrance";
import { Plus, Search, Trash2, Eye, EyeOff, GraduationCap, Pencil, BookOpen, Users, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CommonEntranceManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<CommonExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getCommonExams()
      .then(setExams)
      .catch(() => toast({ title: "Error", description: "Failed to load exams.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteCommonExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Deleted", description: "Exam deleted successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to delete exam.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const result = await toggleCommonExamPublish(id);
      setExams((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isPublished: result.isPublished } : e))
      );
      toast({ title: "Updated", description: `Exam is now ${result.isPublished ? "published" : "unpublished"}.` });
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Common Entrance Exams</h1>
              <p className="text-muted-foreground mt-1">Create and manage 50-question Common Entrance exams</p>
            </div>
            <Button onClick={() => navigate("/admin/create-common-entrance")} className="gap-2">
              <Plus className="w-4 h-4" /> Create Exam
            </Button>
          </div>

          {/* Stats Cards */}
          {!loading && exams.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Exams", value: exams.length, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
                { label: "Published", value: exams.filter(e => e.isPublished).length, icon: Eye, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
                { label: "Drafts", value: exams.filter(e => !e.isPublished).length, icon: FileText, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
                { label: "Total Enrolled", value: exams.reduce((sum, e) => sum + (e.enrolledStudents || 0), 0), icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              ].map((stat) => (
                <Card key={stat.label} className={`${stat.bg} border-0`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-44 pt-6" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No exams yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {search ? "No exams match your search." : "Create your first Common Entrance exam to get started."}
                </p>
                {!search && (
                  <Button onClick={() => navigate("/admin/create-common-entrance")} className="gap-2">
                    <Plus className="w-4 h-4" /> Create Exam
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((exam) => (
                <Card key={exam.id} className="flex flex-col hover:shadow-md transition-shadow">
                  {exam.imageUrl && (
                    <div className="relative w-full h-36 overflow-hidden rounded-t-lg">
                      <img
                        src={exam.imageUrl}
                        alt={exam.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{exam.title}</CardTitle>
                      <Badge variant={exam.isPublished ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                        {exam.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{exam.description || exam.subject}</CardDescription>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{exam.subject}</Badge>
                      <Badge variant="outline" className="text-xs">{exam.questionCount} Qs</Badge>
                      <Badge variant="outline" className="text-xs">{Math.round(exam.timeLimit / 60)} min</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <TooltipProvider>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => navigate(`/admin/edit-common-entrance/${exam.id}`)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Edit this exam</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => handleTogglePublish(exam.id)}
                          >
                            {exam.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {exam.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{exam.isPublished ? "Unpublish exam" : "Publish exam (requires 50 questions)"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(exam.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Delete exam</TooltipContent>
                      </Tooltip>
                    </div>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default CommonEntranceManagement;
