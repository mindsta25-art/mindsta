import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getTopics, type Topic } from "@/api/topics";
import { getLessons, type Lesson } from "@/api/lessons";
import { getStudentByUserId } from "@/api/students";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, 
  Clock, 
  Award, 
  Search, 
  ArrowLeft,
  PlayCircle,
  Star,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Filter,
  X,
  SlidersHorizontal,
  Grid3x3,
  List,
  ChevronDown,
  Target
} from "lucide-react";

interface GroupedTopics {
  [term: string]: {
    [subject: string]: Topic[];
  };
}

const BrowseTopicsEnhanced = () => {
  const { grade } = useParams<{ grade: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Data states
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredContent, setFilteredContent] = useState<(Topic | Lesson)[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  // View states
  const [viewMode, setViewMode] = useState<'topics' | 'lessons' | 'all'>('topics');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating' | 'title'>('popular');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchData();
    if (user) {
      fetchStudentName();
    }
  }, [grade, user]);

  useEffect(() => {
    filterContent();
  }, [topics, lessons, viewMode, searchQuery, selectedTerm, selectedSubjects, selectedDifficulty, sortBy]);

  const fetchStudentName = async () => {
    if (!user) return;
    try {
      const student = await getStudentByUserId(user.id);
      if (student) {
        setStudentName(student.fullName);
      }
    } catch (error) {
      console.error("Error fetching student:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch topics
      const topicsData = await getTopics({
        grade: grade,
        isPublished: true,
      });
      setTopics(topicsData || []);

      // Fetch all lessons for the grade
      const lessonsData = await getLessons(undefined, grade, undefined);
      setLessons(lessonsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let filtered: (Topic | Lesson)[] = [];

    // Select content based on view mode
    if (viewMode === 'topics') {
      filtered = [...topics];
    } else if (viewMode === 'lessons') {
      filtered = [...lessons];
    } else {
      filtered = [...topics, ...lessons];
    }

    // Filter by term
    if (selectedTerm !== "all") {
      filtered = filtered.filter(item => item.term === selectedTerm);
    }

    // Filter by subjects
    if (selectedSubjects.length > 0) {
      filtered = filtered.filter(item => selectedSubjects.includes(item.subject));
    }

    // Filter by difficulty
    if (selectedDifficulty.length > 0) {
      filtered = filtered.filter(item => {
        const difficulty = 'difficulty' in item ? item.difficulty : 
          (item as Lesson).difficulty;
        return selectedDifficulty.includes(difficulty);
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const title = 'title' in item ? item.title : (item as Lesson).title;
        const description = 'description' in item ? item.description : (item as Lesson).description;
        const subject = item.subject;
        
        const query = searchQuery.toLowerCase();
        return title.toLowerCase().includes(query) ||
               description.toLowerCase().includes(query) ||
               subject.toLowerCase().includes(query);
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aTitle = 'title' in a ? a.title : (a as Lesson).title;
      const bTitle = 'title' in b ? b.title : (b as Lesson).title;
      const aRating = 'rating' in a ? a.rating : ((a as Lesson).rating || 0);
      const bRating = 'rating' in b ? b.rating : ((b as Lesson).rating || 0);
      const aEnrolled = 'enrolledStudents' in a ? a.enrolledStudents : ((a as Lesson).enrolledStudents || 0);
      const bEnrolled = 'enrolledStudents' in b ? b.enrolledStudents : ((b as Lesson).enrolledStudents || 0);

      switch (sortBy) {
        case 'title':
          return aTitle.localeCompare(bTitle);
        case 'rating':
          return bRating - aRating;
        case 'popular':
          return bEnrolled - aEnrolled;
        default:
          return 0;
      }
    });

    setFilteredContent(filtered);
  };

  const getAvailableTerms = () => {
    const terms = new Set([...topics, ...lessons].map(item => item.term));
    return Array.from(terms).sort();
  };

  const getAvailableSubjects = () => {
    const subjects = new Set([...topics, ...lessons].map(item => item.subject));
    return Array.from(subjects).sort();
  };

  const getDifficultyLevels = () => {
    return ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'];
  };

  const clearFilters = () => {
    setSelectedTerm("all");
    setSelectedSubjects([]);
    setSelectedDifficulty([]);
    setSearchQuery("");
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (selectedTerm !== "all") count++;
    if (selectedSubjects.length > 0) count += selectedSubjects.length;
    if (selectedDifficulty.length > 0) count += selectedDifficulty.length;
    return count;
  };

  const availableTerms = getAvailableTerms();
  const availableSubjects = getAvailableSubjects();
  const difficultyLevels = getDifficultyLevels();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <StudentHeader studentName={studentName} />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCard = (item: Topic | Lesson, index: number) => {
    const isLesson = 'videoUrl' in item || !('lessonsCount' in item);
    const title = 'title' in item ? item.title : (item as Lesson).title;
    const description = 'description' in item ? item.description : (item as Lesson).description;
    const difficulty = 'difficulty' in item ? item.difficulty : (item as Lesson).difficulty;
    const rating = 'rating' in item ? item.rating : ((item as Lesson).rating || 0);

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card 
          className="h-full cursor-pointer hover:shadow-xl transition-all border-2 hover:border-purple-300"
          onClick={() => {
            if (isLesson) {
              navigate(`/lessons/${item.id}`);
            } else {
              navigate(`/topics/${(item as Topic).slug || item.id}`);
            }
          }}
        >
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-2">
                <Badge className={isLesson ? "bg-blue-500" : "bg-purple-500"}>
                  {isLesson ? 'Lesson' : 'Topic'}
                </Badge>
                <Badge variant="outline">{difficulty}</Badge>
              </div>
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{item.subject} • {item.term}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {description}
            </p>

            <div className="space-y-2">
              {!isLesson && 'lessonsCount' in item && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>{item.lessonsCount || (item as Topic).lessons?.length || 0} Lessons</span>
                </div>
              )}
              {'duration' in item && item.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{item.duration} minutes</span>
                </div>
              )}
            </div>

            <Button className="w-full mt-4 gap-2">
              <PlayCircle className="w-4 h-4" />
              {isLesson ? 'Start Lesson' : 'View Topic'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <StudentHeader studentName={studentName} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/all-grades")}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Grades
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">Grade {grade} Learning Hub</h1>
              <p className="text-white/90 text-lg">
                Explore topics, lessons, and quizzes for your grade
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg py-2 px-4">
              {topics.length} Topics
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg py-2 px-4">
              {lessons.length} Lessons
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg py-2 px-4">
              {availableSubjects.length} Subjects
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    Filters
                  </CardTitle>
                  {activeFiltersCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                {/* View Mode */}
                <div>
                  <label className="text-sm font-medium mb-2 block">View Content</label>
                  <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="topics">Topics Only</SelectItem>
                      <SelectItem value="lessons">Lessons Only</SelectItem>
                      <SelectItem value="all">All Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Term Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {availableTerms.map(term => (
                        <SelectItem key={term} value={term}>{term}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Subject Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Subjects</label>
                  <ScrollArea className="h-48 border rounded-md p-2">
                    {availableSubjects.map(subject => (
                      <div key={subject} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`subject-${subject}`}
                          checked={selectedSubjects.includes(subject)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjects([...selectedSubjects, subject]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                            }
                          }}
                        />
                        <label
                          htmlFor={`subject-${subject}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {subject}
                        </label>
                      </div>
                    ))}
                  </ScrollArea>
                </div>

                <Separator />

                {/* Difficulty Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <div className="space-y-2">
                    {difficultyLevels.map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`difficulty-${level}`}
                          checked={selectedDifficulty.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDifficulty([...selectedDifficulty, level]);
                            } else {
                              setSelectedDifficulty(selectedDifficulty.filter(d => d !== level));
                            }
                          }}
                        />
                        <label
                          htmlFor={`difficulty-${level}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredContent.length} {filteredContent.length === 1 ? 'result' : 'results'}
                </p>
                {activeFiltersCount() > 0 && (
                  <Badge variant="secondary">{activeFiltersCount()} filters active</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="title">Alphabetical</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLayoutMode('grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={layoutMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLayoutMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Grid/List */}
            {filteredContent.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No content found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className={layoutMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredContent.map((item, index) => renderCard(item, index))}
              </div>
            )}
          </div>
        </div>
      </div>

      <StudentFooter />
    </div>
  );
};

export default BrowseTopicsEnhanced;
