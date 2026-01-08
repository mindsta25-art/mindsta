import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Calendar, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSubjectsByGrade, SubjectInfo } from "@/api/lessons";
import mindstaLogo from "../assets/icons/mindsta2.png";

const TermSelection = () => {
  const { grade, term } = useParams<{ grade: string; term: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);

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
            <img src={mindstaLogo} alt="Mindsta Logo" className="w-10 h-10 rounded-lg object-contain" />
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
                <BookOpen className="w-5 h-5 text-primary" />
                Subjects
              </CardTitle>
              <CardDescription>Select a subject to view lessons</CardDescription>
            </CardHeader>
            <CardContent>
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
                      onClick={() => navigate(`/subject/${subject.name.toLowerCase().replace(/\s+/g, '-') }?grade=${grade}&term=${term}`)}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TermSelection;
