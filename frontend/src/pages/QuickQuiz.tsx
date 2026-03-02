import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StudentHeader from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import {
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trophy,
  Target,
  Star,
  Sparkles,
  Clock,
  BookOpen,
} from 'lucide-react';
import { getQuickQuiz } from '@/api/gamification';

interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  lessonId: any;
}

const QuickQuiz = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<{ question: string; selected: string; correct: string; isCorrect: boolean }[]>([]);
  const [showReview, setShowReview] = useState(false);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const data = await getQuickQuiz();
      if (data.quizzes && data.quizzes.length > 0) {
        setQuizzes(data.quizzes);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setStarted(true);
        setAnswers([]);
        setShowReview(false);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === quizzes[currentIndex].correctAnswer;
    if (isCorrect) setScore(s => s + 1);

    setAnswers(prev => [...prev, {
      question: quizzes[currentIndex].question,
      selected: answer,
      correct: quizzes[currentIndex].correctAnswer,
      isCorrect,
    }]);
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCurrentIndex(quizzes.length); // trigger completed state
    }
  };

  const isCompleted = started && currentIndex >= quizzes.length;
  const currentQuiz = quizzes[currentIndex];
  const percentage = quizzes.length > 0 ? Math.round((score / quizzes.length) * 100) : 0;
  const progressValue = quizzes.length > 0 ? ((currentIndex) / quizzes.length) * 100 : 0;

  const getGradeInfo = () => {
    if (percentage >= 90) return { label: 'Excellent!', emoji: '🏆', color: 'text-yellow-500', bg: 'from-yellow-400 to-orange-400' };
    if (percentage >= 70) return { label: 'Great Job!', emoji: '⭐', color: 'text-green-500', bg: 'from-green-400 to-emerald-400' };
    if (percentage >= 50) return { label: 'Good Effort!', emoji: '👍', color: 'text-blue-500', bg: 'from-blue-400 to-cyan-400' };
    return { label: 'Keep Practicing!', emoji: '💪', color: 'text-rose-500', bg: 'from-rose-400 to-pink-400' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950">
      <StudentHeader />

      <main className="pt-2 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Quick Quiz
            </h1>
            <p className="text-muted-foreground text-sm">
              Test your knowledge with 3 random questions from your enrolled lessons
            </p>
          </motion.div>

          {/* Quiz Content */}
          <AnimatePresence mode="wait">

            {/* Start Screen */}
            {!started && !loading && (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="shadow-2xl border-2 border-indigo-100 dark:border-indigo-900/30">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {[
                        { icon: Clock, label: '~2 min', desc: 'Quick session' },
                        { icon: Target, label: '3 Q\'s', desc: 'Random questions' },
                        { icon: Star, label: 'Points', desc: 'Earn rewards' },
                      ].map((item, i) => (
                        <div key={i} className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl">
                          <item.icon className="w-6 h-6 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
                          <div className="font-bold text-sm">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">How it works</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Questions are drawn from your enrolled lessons</li>
                            <li>• Select the correct answer from 4 options</li>
                            <li>• See instant feedback after each question</li>
                            <li>• Review all answers at the end</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={loadQuiz}
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Start Quick Quiz
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                  <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <p className="text-muted-foreground">Preparing your quiz...</p>
              </motion.div>
            )}

            {/* Active Quiz */}
            {started && !isCompleted && !loading && currentQuiz && (
              <motion.div
                key={`question-${currentIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground font-medium">
                      Question {currentIndex + 1} of {quizzes.length}
                    </span>
                    <Badge variant="secondary" className="gap-1">
                      <Trophy className="w-3 h-3" />
                      {score} correct
                    </Badge>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>

                <Card className="shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 pb-4">
                    <CardTitle className="text-lg leading-relaxed font-semibold">
                      {currentQuiz.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {currentQuiz.options.map((option, idx) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === currentQuiz.correctAnswer;
                        const showCorrect = showResult && isCorrect;
                        const showWrong = showResult && isSelected && !isCorrect;

                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: showResult ? 1 : 1.01 }}
                            whileTap={{ scale: showResult ? 1 : 0.99 }}
                            onClick={() => handleAnswer(option)}
                            disabled={showResult}
                            className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium text-sm ${
                              showCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                : showWrong
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                : isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
                            } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  showCorrect ? 'border-green-500 bg-green-500 text-white' :
                                  showWrong ? 'border-red-500 bg-red-500 text-white' :
                                  isSelected ? 'border-indigo-500 bg-indigo-500 text-white' :
                                  'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span>{option}</span>
                              </div>
                              {showCorrect && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                              {showWrong && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                      >
                        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${
                          selectedAnswer === currentQuiz.correctAnswer
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                          {selectedAnswer === currentQuiz.correctAnswer
                            ? '✅ Correct! Well done!'
                            : `❌ The correct answer is: ${currentQuiz.correctAnswer}`}
                        </div>
                        <Button
                          onClick={handleNext}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          {currentIndex < quizzes.length - 1 ? (
                            <>Next Question <Zap className="w-4 h-4 ml-2" /></>
                          ) : (
                            <>See Results <Trophy className="w-4 h-4 ml-2" /></>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Completed Screen */}
            {isCompleted && !showReview && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {(() => {
                  const grade = getGradeInfo();
                  return (
                    <Card className="shadow-2xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                      <div className={`bg-gradient-to-r ${grade.bg} p-8 text-white text-center`}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                          className="text-6xl mb-3"
                        >
                          {grade.emoji}
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-1">{grade.label}</h2>
                        <p className="text-white/80 text-sm">Quiz Complete</p>
                      </div>
                      <CardContent className="p-8">
                        <div className="text-center mb-6">
                          <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                            {percentage}%
                          </div>
                          <p className="text-muted-foreground text-sm">
                            You got <span className="font-semibold text-foreground">{score}</span> out of <span className="font-semibold text-foreground">{quizzes.length}</span> questions correct
                          </p>
                        </div>

                        {/* Score breakdown */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <div className="font-bold text-green-600">{score}</div>
                            <div className="text-xs text-muted-foreground">Correct</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                            <div className="font-bold text-red-600">{quizzes.length - score}</div>
                            <div className="text-xs text-muted-foreground">Incorrect</div>
                          </div>
                          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                            <Target className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                            <div className="font-bold text-indigo-600">{quizzes.length}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => setShowReview(true)}
                            variant="outline"
                            className="w-full border-2"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Review Answers
                          </Button>
                          <Button
                            onClick={loadQuiz}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Another Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </motion.div>
            )}

            {/* Review Screen */}
            {showReview && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      Answer Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {answers.map((a, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border-2 ${
                          a.isCorrect
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {a.isCorrect
                            ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            : <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
                          <p className="font-medium text-sm">{a.question}</p>
                        </div>
                        <div className="ml-7 space-y-1 text-xs">
                          <p className={a.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                            Your answer: <strong>{a.selected}</strong>
                          </p>
                          {!a.isCorrect && (
                            <p className="text-green-700 dark:text-green-400">
                              Correct answer: <strong>{a.correct}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 space-y-3">
                      <Button
                        onClick={loadQuiz}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Another Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
};

export default QuickQuiz;
