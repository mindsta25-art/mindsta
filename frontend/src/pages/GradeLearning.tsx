import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, ChevronRight, BookOpen, Clock, Sparkles, GraduationCap, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTermsByGrade, type TermInfo } from "@/api/lessons";
import mindstaLogo from "../assets/icons/mindsta2.png";

const GradeLearning = () => {
  const { grade } = useParams<{ grade: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [terms, setTerms] = useState<TermInfo[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchTerms = async () => {
      if (!grade) return;
      try {
        setLoadingData(true);
        const data = await getTermsByGrade(grade);
        setTerms(data);
      } catch (error) {
        console.error("Error fetching terms:", error);
        toast({
          title: "Error",
          description: "Failed to load terms. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };
    fetchTerms();
  }, [grade, toast]);

  const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">Loading your learning path...</p>
          <p className="text-sm text-muted-foreground mt-1">Preparing {grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${grade}`} content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-purple-100 dark:border-purple-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  {grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${grade}`}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Select your term to begin</p>
              </div>
            </div>
            <img src={mindstaLogo} alt="Mindsta Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shadow-md" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Mindsta</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto mb-8 sm:mb-12"
        >
          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-950/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <CardHeader className="relative pb-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-md">
                      {grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${grade}`}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Learning Term</CardTitle>
                  <CardDescription className="text-base">
                    Select a term to explore subjects and lessons tailored for your grade level. Each term is packed with engaging content to help you excel.
                  </CardDescription>
                </div>
                <div className="flex flex-col items-center sm:items-end gap-2">
                  <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{terms.length} {terms.length === 1 ? 'Term' : 'Terms'} Available</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Terms Grid */}
        <div className="max-w-5xl mx-auto">
          {terms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {terms.map((term, index) => (
                <motion.div
                  key={term.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="h-full"
                >
                  <Card
                    className="cursor-pointer hover:shadow-2xl transition-all duration-300 group h-full border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-900 overflow-hidden"
                    onClick={() => navigate(`/grade/${grade}/term/${toSlug(term.name)}`)}
                  >
                    {/* Card Header with Gradient */}
                    <div className="relative h-32 bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Calendar className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 text-purple-700 border-none shadow-lg">
                          {term.name}
                        </Badge>
                      </div>
                      
                      {/* Floating Sparkles */}
                      <Sparkles className="absolute top-4 left-4 w-5 h-5 text-white/60 animate-pulse" />
                      <Sparkles className="absolute bottom-4 right-8 w-4 h-4 text-white/40 animate-pulse delay-100" />
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-xl mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-2">
                            {term.name}
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </h3>
                          <p className="text-sm text-muted-foreground">Explore comprehensive learning materials</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-muted-foreground">Subjects</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{term.subjectCount}</p>
                          </div>
                          <div className="bg-pink-50 dark:bg-pink-950/30 p-3 rounded-lg border border-pink-100 dark:border-pink-900">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-pink-600" />
                              <span className="text-xs font-medium text-muted-foreground">Lessons</span>
                            </div>
                            <p className="text-2xl font-bold text-pink-600">{term.lessonCount}</p>
                          </div>
                        </div>

                        {/* CTA */}
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/grade/${grade}/term/${toSlug(term.name)}`);
                          }}
                        >
                          <span>Start Learning</span>
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-2 border-dashed border-purple-300 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">No Terms Available</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    There are no terms configured for {grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${grade}`} yet. Please check back soon or contact support.
                  </p>
                  <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GradeLearning;
