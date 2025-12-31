import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import {
  Brain,
  BookOpen,
  Calculator,
  Globe,
  Beaker,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  Star,
  Lightbulb,
  Heart,
} from 'lucide-react';

interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  gradeLevel: number;
  icon: any;
}

const questions: Question[] = [
  // Grade 1 Questions (Basic)
  {
    id: 1,
    subject: 'Mathematics',
    question: 'What is 5 + 3?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    gradeLevel: 1,
    icon: Calculator,
  },
  {
    id: 2,
    subject: 'English',
    question: 'Which letter comes after "B" in the alphabet?',
    options: ['A', 'C', 'D', 'E'],
    correctAnswer: 1,
    gradeLevel: 1,
    icon: BookOpen,
  },
  // Grade 2 Questions
  {
    id: 3,
    subject: 'Mathematics',
    question: 'What is 12 - 7?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    gradeLevel: 2,
    icon: Calculator,
  },
  {
    id: 4,
    subject: 'English',
    question: 'Choose the correct spelling:',
    options: ['kat', 'cat', 'catt', 'cta'],
    correctAnswer: 1,
    gradeLevel: 2,
    icon: BookOpen,
  },
  // Grade 3 Questions
  {
    id: 5,
    subject: 'Mathematics',
    question: 'What is 6 × 4?',
    options: ['20', '22', '24', '26'],
    correctAnswer: 2,
    gradeLevel: 3,
    icon: Calculator,
  },
  {
    id: 6,
    subject: 'Science',
    question: 'Which of these is a living thing?',
    options: ['Rock', 'Water', 'Tree', 'Chair'],
    correctAnswer: 2,
    gradeLevel: 3,
    icon: Beaker,
  },
  // Grade 4 Questions
  {
    id: 7,
    subject: 'Mathematics',
    question: 'What is 48 ÷ 6?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    gradeLevel: 4,
    icon: Calculator,
  },
  {
    id: 8,
    subject: 'English',
    question: 'What is the plural of "child"?',
    options: ['childs', 'children', 'childes', 'child'],
    correctAnswer: 1,
    gradeLevel: 4,
    icon: BookOpen,
  },
  // Grade 5 Questions
  {
    id: 9,
    subject: 'Mathematics',
    question: 'What is 0.5 + 0.25?',
    options: ['0.55', '0.65', '0.75', '0.85'],
    correctAnswer: 2,
    gradeLevel: 5,
    icon: Calculator,
  },
  {
    id: 10,
    subject: 'Science',
    question: 'What is the process by which plants make their own food?',
    options: ['Respiration', 'Photosynthesis', 'Digestion', 'Transpiration'],
    correctAnswer: 1,
    gradeLevel: 5,
    icon: Beaker,
  },
  // Grade 6 Questions
  {
    id: 11,
    subject: 'Mathematics',
    question: 'Solve for x: 3x + 4 = 19',
    options: ['3', '5', '7', '9'],
    correctAnswer: 1,
    gradeLevel: 6,
    icon: Calculator,
  },
  {
    id: 12,
    subject: 'English',
    question: 'Which is the correct form of the verb? "She _____ to school every day."',
    options: ['go', 'goes', 'going', 'gone'],
    correctAnswer: 1,
    gradeLevel: 6,
    icon: BookOpen,
  },
  // Common Entrance Level Questions (Advanced)
  {
    id: 13,
    subject: 'Mathematics',
    question: 'If a:b = 2:3 and b:c = 4:5, what is a:c?',
    options: ['2:5', '8:15', '6:10', '3:7'],
    correctAnswer: 1,
    gradeLevel: 7,
    icon: Calculator,
  },
  {
    id: 14,
    subject: 'English',
    question: 'Identify the figure of speech: "The classroom was a zoo."',
    options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
    correctAnswer: 1,
    gradeLevel: 7,
    icon: BookOpen,
  },
  {
    id: 15,
    subject: 'Science',
    question: 'What is the chemical symbol for water?',
    options: ['H2O', 'O2', 'CO2', 'NaCl'],
    correctAnswer: 0,
    gradeLevel: 7,
    icon: Beaker,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const GradeAssessment = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleStart = () => {
    setStarted(true);
    setTimeLeft(30);
  };

  const handleAnswer = () => {
    if (selectedOption === null) return;

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setShowResult(true);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        setCompleted(true);
      }
    }, 1500);
  };

  const calculateRecommendedGrade = () => {
    let gradeScores: { [key: number]: { correct: number; total: number } } = {};

    // Initialize score tracking for each grade
    questions.forEach((question) => {
      if (!gradeScores[question.gradeLevel]) {
        gradeScores[question.gradeLevel] = { correct: 0, total: 0 };
      }
      gradeScores[question.gradeLevel].total += 1;
    });

    // Count correct answers per grade
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        gradeScores[question.gradeLevel].correct += 1;
      }
    });

    // Calculate percentage for each grade
    let gradePercentages: { [key: number]: number } = {};
    Object.entries(gradeScores).forEach(([grade, scores]) => {
      gradePercentages[parseInt(grade)] = (scores.correct / scores.total) * 100;
    });

    // Determine recommended grade based on performance pattern
    let recommendedGrade = 1;
    let lastHighPerformance = 1;

    // Find the highest grade level where student scored 70% or above
    for (let grade = 1; grade <= 7; grade++) {
      if (gradePercentages[grade] >= 70) {
        lastHighPerformance = grade;
      }
    }

    // Recommendation logic
    if (lastHighPerformance === 7) {
      // If they excel at Common Entrance level
      recommendedGrade = 7; // Common Entrance
    } else if (lastHighPerformance >= 6) {
      // Strong performance at Grade 6
      recommendedGrade = lastHighPerformance;
    } else if (lastHighPerformance >= 1) {
      // Start at their highest comfortable level
      recommendedGrade = lastHighPerformance;
    } else {
      // If struggling across the board, start at Grade 1
      recommendedGrade = 1;
    }

    // Adjust based on overall performance
    const totalCorrect = answers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
    const overallPercentage = (totalCorrect / questions.length) * 100;

    // If overall performance is very strong, consider moving up
    if (overallPercentage >= 85 && recommendedGrade < 7) {
      recommendedGrade = Math.min(recommendedGrade + 1, 7);
    }

    // If overall performance is weak, ensure appropriate placement
    if (overallPercentage < 40 && recommendedGrade > 1) {
      recommendedGrade = Math.max(recommendedGrade - 1, 1);
    }

    return { 
      grade: recommendedGrade, 
      percentage: overallPercentage, 
      totalCorrect,
      gradePercentages 
    };
  };

  const getGradeName = (gradeNum: number) => {
    if (gradeNum === 7) return 'Common Entrance';
    return `Grade ${gradeNum}`;
  };

  const getRecommendationMessage = (grade: number, percentage: number) => {
    if (grade === 7) {
      return "Excellent! You've demonstrated strong mastery across all levels. You're ready for Common Entrance preparation courses that will help you excel in entrance examinations.";
    } else if (grade === 6) {
      return `Great performance! You've shown strong understanding of upper primary concepts. Grade ${grade} will provide the perfect foundation to continue building advanced skills.`;
    } else if (grade >= 4) {
      return `Good work! You've demonstrated solid understanding at this level. Grade ${grade} courses will help you strengthen your foundation and progress confidently.`;
    } else if (grade >= 2) {
      return `Starting at Grade ${grade} will ensure you build a strong foundation. This level is perfect for developing core skills that will support your learning journey.`;
    } else {
      return `We recommend starting with Grade ${grade} to build fundamental skills. This will give you a solid foundation for your educational journey.`;
    }
  };

  const currentQ = questions[currentQuestion];
  const Icon = currentQ?.icon || BookOpen;

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
        <StudentHeader />
        
        <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl mt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Grade Level Assessment</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Find Your Perfect
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Learning Level
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Not sure which grade to start with? Take our quick assessment to find the perfect level for your learning journey.
            </p>

            <Card className="border-2 hover:border-purple-400 transition-all duration-300 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">What to Expect</CardTitle>
                <CardDescription>A quick assessment to determine your ideal grade level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="font-semibold">15 Questions</p>
                    <p className="text-sm text-muted-foreground">~12 minutes</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="font-semibold">Multiple Subjects</p>
                    <p className="text-sm text-muted-foreground">Math, Science, English</p>
                  </div>
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <Award className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                    <p className="font-semibold">Grade 1 - CE</p>
                    <p className="text-sm text-muted-foreground">Comprehensive range</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">Questions covering Grade 1 through Common Entrance level</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">Progressive difficulty to accurately assess your level</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">Personalized grade recommendation based on your performance</p>
                  </div>
                </div>

                <Button
                  onClick={handleStart}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg h-14"
                >
                  Start Assessment
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <StudentFooter />
      </div>
    );
  }

  if (completed) {
    const result = calculateRecommendedGrade();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
        <StudentHeader />
        
        <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl mt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">Assessment Complete</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Your Results Are In!
              </span>
            </h1>

            <Card className="border-2 border-purple-400 shadow-2xl mb-8">
              <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8" />
                  <CardTitle className="text-3xl">{getGradeName(result.grade)}</CardTitle>
                  <Sparkles className="w-8 h-8" />
                </div>
                <CardDescription className="text-white/90 text-lg">
                  Your Recommended Starting Level
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{result.percentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <CheckCircle className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.totalCorrect}/{questions.length}</p>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl text-left">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Your Assessment Summary
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {getRecommendationMessage(result.grade, result.percentage)}
                  </p>
                  
                  {/* Performance Breakdown */}
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold mb-2">Performance by Level:</p>
                    {Object.entries(result.gradePercentages)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([grade, percentage]) => (
                        <div key={grade} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{getGradeName(parseInt(grade))}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  percentage >= 70 ? 'bg-green-500' : 
                                  percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-medium w-12 text-right">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => {
                      const gradeParam = result.grade === 7 ? 'common-entrance' : result.grade;
                      navigate(`/browse?grade=${gradeParam}`);
                    }}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
                  >
                    <BookOpen className="mr-2 w-5 h-5" />
                    Browse {getGradeName(result.grade)} Courses
                  </Button>
                  <Button
                    onClick={() => navigate('/browse')}
                    size="lg"
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Explore All Courses
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Recommendations Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 space-y-4"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Personalized Learning Recommendations
              </h2>

              {/* Study Plan Card */}
              <Card className="border-2 border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Your Personalized Action Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Improvement Areas */}
                    {result.gradePercentages && Object.entries(result.gradePercentages).some(([, percentage]) => percentage < 60) && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Focus Areas
                        </h3>
                        <ul className="space-y-2 text-sm">
                          {Object.entries(result.gradePercentages)
                            .filter(([, percentage]) => percentage < 60)
                            .map(([grade, percentage]) => (
                              <li key={grade} className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span className="text-muted-foreground">
                                  {getGradeName(parseInt(grade))} content ({percentage.toFixed(0)}% - needs more practice)
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Strengths */}
                    {result.gradePercentages && Object.entries(result.gradePercentages).some(([, percentage]) => percentage >= 75) && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Your Strengths
                        </h3>
                        <ul className="space-y-2 text-sm">
                          {Object.entries(result.gradePercentages)
                            .filter(([, percentage]) => percentage >= 75)
                            .map(([grade, percentage]) => (
                              <li key={grade} className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span className="text-muted-foreground">
                                  {getGradeName(parseInt(grade))} mastered ({percentage.toFixed(0)}%)
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Study Schedule Recommendation */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recommended Study Schedule
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                        <p className="font-medium text-blue-600">Monday-Wednesday</p>
                        <p className="text-xs text-muted-foreground mt-1">Core Subjects Focus</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                        <p className="font-medium text-blue-600">Thursday-Friday</p>
                        <p className="text-xs text-muted-foreground mt-1">Practice & Review</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                        <p className="font-medium text-blue-600">Weekend</p>
                        <p className="text-xs text-muted-foreground mt-1">Catch-up & Enrichment</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Aim for 1-2 hours daily (younger students) or 2-3 hours (older students)
                    </p>
                  </div>

                  {/* Learning Tips */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Study Tips for Success
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">1.</span>
                        <span>Break down complex topics into smaller, manageable chunks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">2.</span>
                        <span>Use multiple resources: videos, readings, and practice exercises</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">3.</span>
                        <span>Study in focused 25-minute sessions (Pomodoro technique)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">4.</span>
                        <span>Review regularly, not just before tests</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Tracking Card */}
              <Card className="border-2 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Track Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Complete 3+ lessons per week</p>
                        <p className="text-xs">Consistent learning builds strong foundations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Achieve 70%+ on all quizzes</p>
                        <p className="text-xs">This shows good understanding of concepts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Retake assessment in 4-6 weeks</p>
                        <p className="text-xs">Measure your improvement and progress</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Motivational Message */}
              <Card className="border-2 border-pink-200 shadow-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10">
                <CardContent className="pt-6 pb-6 text-center">
                  <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">Remember: Learning is a Journey!</p>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Everyone progresses at their own pace. Celebrate small wins, stay curious, and never stop asking questions. 
                    Your dedication to taking this assessment shows you're committed to your education - that's already a huge step forward!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>

        <StudentFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />
      
      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl mt-20">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</p>
              <Badge variant="outline" className="mt-1">
                <Icon className="w-3 h-3 mr-1" />
                {currentQ.subject}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{timeLeft}s</p>
              <p className="text-xs text-muted-foreground">Time Left</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -20 }}
            variants={fadeInUp}
          >
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <Icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Question {currentQuestion + 1}</CardTitle>
                    <CardDescription>Choose the best answer</CardDescription>
                  </div>
                </div>
                <p className="text-lg font-semibold">{currentQ.question}</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !showResult && setSelectedOption(index)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        showResult
                          ? index === currentQ.correctAnswer
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : index === selectedOption
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700 opacity-50'
                          : selectedOption === index
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {showResult && (
                          <>
                            {index === currentQ.correctAnswer && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {index === selectedOption && index !== currentQ.correctAnswer && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => currentQuestion > 0 && setCurrentQuestion(currentQuestion - 1)}
                    disabled={currentQuestion === 0 || showResult}
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleAnswer}
                    disabled={selectedOption === null || showResult}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      <StudentFooter />
    </div>
  );
};

export default GradeAssessment;
