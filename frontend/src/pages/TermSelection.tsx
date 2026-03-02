import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { StudentFooter } from "@/components/StudentFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Calendar, ChevronRight, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSubjectsByGrade, SubjectInfo } from "@/api/lessons";
import { api } from "@/lib/apiClient";

interface Topic {
  _id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  term: string;
  lessons: any[];
  price: number;
}

const TermSelection = () => {
  const { grade, term } = useParams<{ grade: string; term: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!grade || !term) return;

      try {
        setLoading(true);
        // Convert URL format back to term name (e.g., "first-term" -> "First Term")
        const termName = term.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const subjectsData = await getSubjectsByGrade(grade, termName);
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({
          title: "Error",
          description: "Failed to load subjects. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [grade, term, toast]);

  // Fetch topics when a subject is selected
  const fetchTopics = async (subjectName: string) => {
    if (!grade || !term) return;
    
    try {
      setLoadingTopics(true);
      const termName = term.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const params = new URLSearchParams({
        subject: subjectName,
        grade: grade,
        term: termName
      });
      
      const response = await api.get(`/topics?${params.toString()}`);
      const topicsData = Array.isArray(response) ? response : (response.data || []);
      setTopics(topicsData);
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast({
        title: "Error",
        description: "Failed to load topics. Please try again.",
        variant: "destructive",
      });
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSubjectClick = (subjectName: string) => {
    setSelectedSubject(subjectName);
    fetchTopics(subjectName);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setTopics([]);
  };

  // Icons mapped to lucide (using BookOpen uniformly for simplicity to keep design cohesive)

  const getTermDisplayName = () => {
    if (!term) return '';
    return term.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getGradeDisplayName = () => {
    if (grade === 'Common Entrance') return 'Common Entrance';
    return `Grade ${grade}`;
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm shadow border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">
                {getGradeDisplayName()} • {getTermDisplayName()}
              </h1>
            </div>
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Mindsta</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedSubject ? (
                  <>
                    <Layers className="w-5 h-5 text-primary" />
                    Topics in {selectedSubject}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 text-primary" />
                    Subjects
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {selectedSubject 
                  ? "Select a topic or browse all lessons" 
                  : "Select a subject to view topics and lessons"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSubject ? (
                // Show topics view
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToSubjects}
                    className="mb-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Subjects
                  </Button>

                  {loadingTopics ? (
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  ) : topics.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        {topics.map((topic) => (
                          <Card
                            key={topic._id}
                            className="cursor-pointer hover:shadow-sm transition-all group"
                            onClick={() => navigate(`/topic/${topic._id}?grade=${grade}&term=${term}`)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <Layers className="w-5 h-5 text-primary mt-1" />
                                  <div className="flex-1">
                                    <h3 className="font-medium text-base flex items-center gap-2">
                                      {topic.title}
                                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {topic.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {topic.lessons?.length || 0} lessons
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Browse all lessons option */}
                      <div className="mt-6 pt-6 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/subject/${selectedSubject.toLowerCase().replace(/\s+/g, '-')}?grade=${grade}&term=${term}`)}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Browse All Lessons in {selectedSubject}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-foreground">No topics available</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No topics found for this subject. Browse all lessons instead.
                      </p>
                      <Button
                        onClick={() => navigate(`/subject/${selectedSubject.toLowerCase().replace(/\s+/g, '-')}?grade=${grade}&term=${term}`)}
                        className="mt-4"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Browse All Lessons
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // Show subjects view
                <>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  ) : subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjects.map((subject) => (
                        <Card
                          key={subject.name}
                          className="cursor-pointer hover:shadow-sm transition-all group"
                          onClick={() => handleSubjectClick(subject.name)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <BookOpen className="w-5 h-5 text-muted-foreground" aria-hidden />
                                <div className="flex-1">
                                  <h3 className="font-medium text-base flex items-center gap-2">
                                    {subject.name}
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.lessonCount} {subject.lessonCount === 1 ? 'lesson' : 'lessons'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-foreground">No subjects available</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        There are no subjects for this term yet.
                      </p>
                      <Button
                        onClick={() => navigate(-1)}
                        className="mt-4"
                        variant="outline"
                      >
                        Go back
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default TermSelection;
