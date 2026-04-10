import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDraftLessons, updateLesson, type Lesson } from "@/api/lessons";
import { Search, Clock, BookOpen } from "lucide-react";

const DraftLessons = () => {
  const { toast } = useToast();
  const LOCAL_DRAFT_ID = "local-lesson-draft";
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [localDraftLesson, setLocalDraftLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const data = await getDraftLessons();
      setLessons(data);
    } catch (error) {
      console.error("Failed to load draft lessons:", error);
      toast({
        title: "Unable to load drafts",
        description: "Please refresh the page or try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
    const parseLocalDraft = () => {
      try {
        const draftStr = localStorage.getItem("mindsta_lesson_draft");
        if (!draftStr) {
          setLocalDraftLesson(null);
          return;
        }

        const draft = JSON.parse(draftStr);
        const lessonForm = draft.lessonForm || {};
        setLocalDraftLesson({
          id: LOCAL_DRAFT_ID,
          title: lessonForm.title || "Saved Lesson Draft",
          subtitle: lessonForm.subtitle || "",
          description: lessonForm.description || "",
          content: lessonForm.overview || "",
          subject: lessonForm.subject || "Unspecified",
          grade: lessonForm.grade || "Unspecified",
          term: lessonForm.term || "Unspecified",
          difficulty: lessonForm.difficulty || "beginner",
          duration: lessonForm.duration || 30,
          videoUrl: lessonForm.videoUrl || "",
          imageUrl: lessonForm.imageUrl || "",
          imageDisplaySize: lessonForm.imageDisplaySize || "full",
          imageObjectFit: lessonForm.imageObjectFit || "cover",
          price: lessonForm.price || 0,
          isPublished: false,
          keywords: lessonForm.keywords || [],
          learningObjectives: lessonForm.learningObjectives || [],
          whatYouWillLearn: lessonForm.whatYouWillLearn || [],
          requirements: lessonForm.requirements || [],
          targetAudience: lessonForm.targetAudience || [],
          curriculum: lessonForm.curriculum || [],
          createdAt: draft.timestamp || new Date().toISOString(),
          updatedAt: draft.timestamp || new Date().toISOString(),
        });
      } catch {
        setLocalDraftLesson(null);
      }
    };

    parseLocalDraft();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "mindsta_lesson_draft") {
        parseLocalDraft();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleDiscardLocalDraft = () => {
    localStorage.removeItem("mindsta_lesson_draft");
    localStorage.removeItem("mindsta_curriculum_draft");
    setLocalDraftLesson(null);
    toast({ title: "Draft Removed", description: "Your saved lesson draft has been discarded." });
  };

  const allDrafts = localDraftLesson ? [localDraftLesson, ...lessons] : lessons;

  const filteredLessons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allDrafts.filter((lesson) => {
      if (!query) return true;
      return [
        lesson.title,
        lesson.subtitle,
        lesson.description,
        lesson.subject,
        lesson.grade,
        lesson.term,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [allDrafts, searchQuery]);

  const handlePublish = async (lesson: Lesson) => {
    setPublishingId(lesson.id);
    try {
      await updateLesson(lesson.id, { isPublished: true } as Partial<Lesson>);
      toast({
        title: "Lesson Published",
        description: `"${lesson.title}" is now visible to students.`,
      });
      await fetchDrafts();
    } catch (error) {
      console.error("Publish failed:", error);
      toast({
        title: "Publish failed",
        description: "Unable to publish this draft. Try again later.",
        variant: "destructive",
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Draft Lessons</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all unpublished lessons currently saved as drafts in the admin panel.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/lesson-management')}>
                View all lessons
              </Button>
              <Button size="sm" onClick={() => navigate('/admin/create-lesson')}>
                Create new lesson
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 max-w-md w-full">
            <Input
              placeholder="Search drafts by title, subject, grade or term"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1"
            />
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>{allDrafts.length}</CardTitle>
              <CardDescription>Total drafts</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{filteredLessons.length}</CardTitle>
              <CardDescription>Matching search results</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Draft list</CardTitle>
              </div>
              <CardDescription>
                {loading
                  ? "Loading drafts..."
                  : filteredLessons.length > 0
                  ? `${filteredLessons.length} draft lesson${filteredLessons.length !== 1 ? 's' : ''} found.`
                  : "No drafts found."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Term</TableHead>
                      <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                      Loading draft lessons...
                    </TableCell>
                  </TableRow>
                ) : filteredLessons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                      No draft lessons available.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLessons.map((lesson) => {
                    const isLocalDraft = lesson.id === LOCAL_DRAFT_ID;
                    return (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{lesson.title}</span>
                            {lesson.subtitle ? <span className="text-xs text-muted-foreground">{lesson.subtitle}</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>{lesson.subject}</TableCell>
                        <TableCell>{lesson.grade}</TableCell>
                        <TableCell>{lesson.term}</TableCell>
                        <TableCell>{new Date(lesson.updatedAt || lesson.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase tracking-[0.08em] text-[10px] font-semibold py-1 px-2">
                            {isLocalDraft ? "Local Draft" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(isLocalDraft ? `/admin/create-lesson?edit=${LOCAL_DRAFT_ID}` : `/admin/create-lesson?edit=${lesson.id}`)}
                          >
                            {isLocalDraft ? "Continue" : "Edit"}
                          </Button>
                          {isLocalDraft ? (
                            <Button size="sm" variant="outline" onClick={handleDiscardLocalDraft}>
                              Discard
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={publishingId === lesson.id}
                              onClick={() => handlePublish(lesson)}
                            >
                              {publishingId === lesson.id ? "Publishing..." : "Publish"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
         
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DraftLessons;
