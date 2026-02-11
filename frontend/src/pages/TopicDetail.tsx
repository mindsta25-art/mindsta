import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock, Layers, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";

interface Lesson {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  duration: number;
  difficulty: string;
  order: number;
}

interface Topic {
  _id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  term: string;
  lessons: Lesson[];
  price: number;
  discountPercentage: number;
}

const TopicDetail = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const grade = searchParams.get("grade");
  const term = searchParams.get("term");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!topicId) return;

      try {
        setLoading(true);
        const response = await api.get(`/topics/${topicId}`);
        const topicData = response.data || response;
        setTopic(topicData);
      } catch (error) {
        console.error("Error fetching topic:", error);
        toast({
          title: "Error",
          description: "Failed to load topic. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId, toast]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-500";
      case "intermediate":
        return "bg-yellow-500";
      case "advanced":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 dark:bg-background">
        <header className="bg-card/90 backdrop-blur-sm shadow border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-muted/20 dark:bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Topic Not Found</CardTitle>
            <CardDescription>The topic you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm shadow border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{topic.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {topic.subject} • Grade {grade} • {term?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Topic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                About This Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{topic.description}</p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{topic.lessons.length} Lessons</span>
                </div>
                {topic.price > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">₦{topic.price.toLocaleString()}</span>
                    {topic.discountPercentage > 0 && (
                      <Badge variant="secondary">{topic.discountPercentage}% off bundle</Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>Lessons in This Topic</CardTitle>
              <CardDescription>Click on any lesson to start learning</CardDescription>
            </CardHeader>
            <CardContent>
              {topic.lessons.length > 0 ? (
                <div className="space-y-3">
                  {topic.lessons
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((lesson, index) => (
                      <Card
                        key={lesson._id}
                        className="cursor-pointer hover:shadow-sm transition-all group"
                        onClick={() => navigate(`/lesson/${lesson._id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                                {lesson.title}
                              </h3>
                              {lesson.subtitle && (
                                <p className="text-sm text-muted-foreground mt-1">{lesson.subtitle}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{lesson.duration} min</span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`${getDifficultyColor(lesson.difficulty)} text-white border-0`}
                                >
                                  {lesson.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <PlayCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No lessons available in this topic yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TopicDetail;
