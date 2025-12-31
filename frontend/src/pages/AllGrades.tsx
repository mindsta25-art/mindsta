import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  TrendingUp,
  ArrowRight,
  Star,
  Award,
  Target,
  ShoppingCart,
  Sparkles,
  Zap,
  Package
} from "lucide-react";
import { formatCurrency } from "@/config/siteConfig";

interface GradeInfo {
  grade: string;
  displayName: string;
  description: string;
  ageRange: string;
  subjects: number;
  students: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  color: string;
  icon: typeof GraduationCap;
  features: string[];
  popularSubjects?: { name: string; price: number; term: string }[];
  bundlePrice?: number;
  bundleId?: string;
  bundleName?: string;
  bundleDescription?: string;
  bundleEnrollmentCount?: number;
}

const grades: GradeInfo[] = [
  {
    grade: "1",
    displayName: "Grade 1",
    description: "Foundation learning for young minds. Building blocks for reading, writing, and basic mathematics.",
    ageRange: "6-7 years",
    subjects: 8,
    students: "2,450+",
    difficulty: "Beginner",
    color: "from-blue-400 to-cyan-400",
    icon: Star,
    features: ["Interactive lessons", "Fun activities", "Basic concepts", "Visual learning"]
  },
  {
    grade: "2",
    displayName: "Grade 2",
    description: "Expanding knowledge and skills. Developing reading comprehension and mathematical reasoning.",
    ageRange: "7-8 years",
    subjects: 8,
    students: "2,320+",
    difficulty: "Beginner",
    color: "from-green-400 to-emerald-400",
    icon: Star,
    features: ["Story comprehension", "Simple arithmetic", "Science basics", "Creative writing"]
  },
  {
    grade: "3",
    displayName: "Grade 3",
    description: "Building confidence and independence. Introduction to multiplication, division, and science exploration.",
    ageRange: "8-9 years",
    subjects: 9,
    students: "2,180+",
    difficulty: "Beginner",
    color: "from-yellow-400 to-amber-400",
    icon: Award,
    features: ["Multiplication tables", "Reading fluency", "Basic science", "Problem solving"]
  },
  {
    grade: "4",
    displayName: "Grade 4",
    description: "Critical thinking development. Advanced reading, writing essays, and complex mathematics.",
    ageRange: "9-10 years",
    subjects: 10,
    students: "1,980+",
    difficulty: "Intermediate",
    color: "from-orange-400 to-red-400",
    icon: Award,
    features: ["Essay writing", "Fractions & decimals", "Research skills", "Critical thinking"]
  },
  {
    grade: "5",
    displayName: "Grade 5",
    description: "Preparing for higher education. In-depth subject exploration and analytical thinking.",
    ageRange: "10-11 years",
    subjects: 11,
    students: "1,850+",
    difficulty: "Intermediate",
    color: "from-indigo-400 to-cyan-400",
    icon: Target,
    features: ["Advanced math", "Literature analysis", "Science experiments", "Presentation skills"]
  },
  {
    grade: "6",
    displayName: "Grade 6",
    description: "Advanced learning and specialization. Comprehensive curriculum for academic excellence.",
    ageRange: "11-12 years",
    subjects: 12,
    students: "1,720+",
    difficulty: "Advanced",
    color: "from-indigo-400 to-indigo-400",
    icon: Target,
    features: ["Algebra basics", "Advanced writing", "Scientific method", "Independent study"]
  },
  {
    grade: "Common Entrance",
    displayName: "Common Entrance",
    description: "Specialized preparation for entrance examinations. Comprehensive review and exam strategies.",
    ageRange: "11-13 years",
    subjects: 15,
    students: "3,200+",
    difficulty: "Advanced",
    color: "from-rose-400 to-cyan-400",
    icon: Award,
    features: ["Exam techniques", "Past questions", "Time management", "All subjects covered"]
  }
];

export const AllGrades = () => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toast } = useToast();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [gradesWithBundles, setGradesWithBundles] = useState<GradeInfo[]>(grades);

  // Fetch bundles from backend on component mount
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const bundles = await api.get('/bundles?isActive=true');
        console.log('Fetched bundles:', bundles);
        
        // Merge bundles with grade data
        const updatedGrades = grades.map(grade => {
          // Match bundle based on grade
          // Bundle grade format: "Grade 1", "Grade 2", etc.
          // Grade format in grades array: "1", "2", etc.
          let matchedBundle = null;
          
          if (grade.grade === "Common Entrance") {
            matchedBundle = bundles.find((b: any) => b.grade === "Common Entrance");
          } else {
            matchedBundle = bundles.find((b: any) => 
              b.grade === `Grade ${grade.grade}` || 
              b.grade === grade.grade ||
              b.grade.includes(grade.grade)
            );
          }
          
          if (matchedBundle) {
            console.log(`Matched bundle for ${grade.displayName}:`, matchedBundle);
            return {
              ...grade,
              bundleId: matchedBundle._id,
              bundleName: matchedBundle.name,
              bundleDescription: matchedBundle.description,
              bundlePrice: matchedBundle.bundlePrice,
              bundleEnrollmentCount: matchedBundle.enrollmentCount,
              popularSubjects: matchedBundle.subjects.map((s: any) => ({
                name: s.name,
                price: s.price,
                term: s.term
              }))
            };
          }
          
          // Return grade without bundle data if no match
          return {
            ...grade,
            bundleId: undefined,
            bundleName: undefined,
            bundleDescription: undefined,
            bundlePrice: undefined,
            bundleEnrollmentCount: undefined,
            popularSubjects: undefined
          };
        });
        
        setGradesWithBundles(updatedGrades);
      } catch (error) {
        console.error("Error fetching bundles:", error);
        // Keep grades without bundles on error
        setGradesWithBundles(grades.map(g => ({
          ...g,
          bundleId: undefined,
          bundleName: undefined,
          bundleDescription: undefined,
          bundlePrice: undefined,
          bundleEnrollmentCount: undefined,
          popularSubjects: undefined
        })));
      }
    };
    
    fetchBundles();
  }, []);

  const handleQuickBuy = async (subject: string, grade: string, term: string, price: number) => {
    const cartKey = `${subject}-${grade}-${term}`;
    try {
      setAddingToCart(cartKey);
      await addToCart({ subject, grade, term, price });
      toast({
        title: "Added to cart!",
        description: `${subject} for Grade ${grade} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const handleBundlePurchase = async (gradeInfo: GradeInfo) => {
    if (!gradeInfo.popularSubjects) return;
    
    try {
      setAddingToCart(`bundle-${gradeInfo.grade}`);
      for (const subject of gradeInfo.popularSubjects) {
        await addToCart({ 
          subject: subject.name, 
          grade: gradeInfo.grade, 
          term: subject.term, 
          price: subject.price 
        });
      }
      toast({
        title: "Bundle added to cart!",
        description: `${gradeInfo.displayName} starter pack has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding bundle:", error);
      toast({
        title: "Error",
        description: "Failed to add bundle to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-500";
      case "Intermediate": return "bg-yellow-500";
      case "Advanced": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-900/20 dark:to-slate-900">
      <StudentHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <span className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400">All Grades</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent px-4">
            Choose Your Learning Path
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Select your grade level to access tailored lessons, interactive content, and personalized learning experiences
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <Card className="border-2 hover:border-indigo-300 transition-colors">
            <CardContent className="p-4 sm:p-6 text-center">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-indigo-600" />
              <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">10,000+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Lessons</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-cyan-300 transition-colors">
            <CardContent className="p-4 sm:p-6 text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-cyan-600" />
              <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">15,700+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Active Students</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-green-300 transition-colors">
            <CardContent className="p-4 sm:p-6 text-center">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-green-600" />
              <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">70+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Subjects Covered</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-indigo-300 transition-colors">
            <CardContent className="p-4 sm:p-6 text-center">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-indigo-600" />
              <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">95%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Grades Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {gradesWithBundles.map((gradeInfo) => {
            const IconComponent = gradeInfo.icon;
            return (
              <Card 
                key={gradeInfo.grade}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-indigo-300"
                onClick={() => {
                  if (gradeInfo.grade === "Common Entrance") {
                    navigate(`/grade/common-entrance`);
                  } else {
                    navigate(`/grade/${gradeInfo.grade}`);
                  }
                }}
              >
                {/* Header with Gradient */}
                <div className={`h-28 sm:h-32 bg-gradient-to-br ${gradeInfo.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 sm:mb-2 opacity-90" />
                    <h2 className="text-xl sm:text-2xl font-bold">{gradeInfo.displayName}</h2>
                  </div>
                  {/* Difficulty Badge */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <Badge className={`${getDifficultyColor(gradeInfo.difficulty)} text-white text-xs`}>
                      {gradeInfo.difficulty}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6">
                  {/* Age Range */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{gradeInfo.ageRange}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                    {gradeInfo.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-purple-600">{gradeInfo.subjects}</p>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-blue-600">{gradeInfo.students}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs font-semibold mb-1.5 sm:mb-2">What you'll learn:</p>
                    <div className="flex flex-wrap gap-1">
                      {gradeInfo.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Quick Buy Section */}
                  {gradeInfo.popularSubjects && gradeInfo.popularSubjects.length > 0 && (
                    <div className="mb-4 p-3 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-100">Quick Buy - Popular Subjects</h4>
                      </div>
                      
                      {/* Individual Subjects */}
                      <div className="space-y-2 mb-3">
                        {gradeInfo.popularSubjects.map((subject) => {
                          const cartKey = `${subject.name}-${gradeInfo.grade}-${subject.term}`;
                          const inCart = isInCart(subject.name, gradeInfo.grade, subject.term);
                          const isLoading = addingToCart === cartKey;
                          
                          return (
                            <div key={subject.name} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                                {subject.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-600 whitespace-nowrap">
                                  {formatCurrency(subject.price)}
                                </span>
                                <Button
                                  size="sm"
                                  variant={inCart ? "secondary" : "default"}
                                  className="h-7 px-2 gap-1 text-xs"
                                  disabled={isLoading || inCart}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickBuy(subject.name, gradeInfo.grade, subject.term, subject.price);
                                  }}
                                >
                                  {isLoading ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </>
                                  ) : inCart ? (
                                    <>✓ Added</>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3 h-3" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bundle Offer */}
                      {gradeInfo.bundlePrice && (
                        <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                                {gradeInfo.bundleName || "Starter Bundle"}
                              </span>
                              <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">
                                Save {formatCurrency(gradeInfo.popularSubjects.reduce((sum, s) => sum + s.price, 0) - gradeInfo.bundlePrice)}
                              </Badge>
                            </div>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(gradeInfo.bundlePrice)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full h-8 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs"
                            disabled={addingToCart === `bundle-${gradeInfo.grade}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBundlePurchase(gradeInfo);
                            }}
                          >
                            {addingToCart === `bundle-${gradeInfo.grade}` ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Add All 3 Subjects
                              </>
                            )}
                          </Button>
                          {gradeInfo.bundleEnrollmentCount !== undefined && gradeInfo.bundleEnrollmentCount > 0 && (
                            <p className="text-[10px] text-center text-muted-foreground mt-1">
                              {gradeInfo.bundleEnrollmentCount}+ students enrolled
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className="w-full gap-2 group-hover:gap-3 transition-all text-sm sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (gradeInfo.grade === "Common Entrance") {
                        navigate(`/grade/common-entrance`);
                      } else {
                        navigate(`/grade/${gradeInfo.grade}`);
                      }
                    }}
                  >
                    Browse All Subjects
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-16 text-center px-4">
          <Card className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-0">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Not sure which grade to choose?</h3>
              <p className="mb-4 sm:mb-6 opacity-90 text-sm sm:text-base">
                Take our quick assessment to find the perfect learning level for you
              </p>
              <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="gap-2 text-sm sm:text-base"
                  onClick={() => navigate("/assessment")}
                >
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  Take Assessment
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm sm:text-base"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
};

export default AllGrades;
