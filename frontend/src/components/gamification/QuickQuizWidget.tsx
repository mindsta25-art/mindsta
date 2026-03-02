import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  lessonId: any;
}

interface QuickQuizProps {
  onFetchQuiz: () => Promise<{ quizzes: QuizQuestion[] }>;
}

export const QuickQuizWidget = ({ onFetchQuiz }: QuickQuizProps) => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const data = await onFetchQuiz();
      if (data.quizzes && data.quizzes.length > 0) {
        setQuizzes(data.quizzes);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setStarted(true);
      } else {
        setQuizzes([]);
        setStarted(false);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      setQuizzes([]);
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === quizzes[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setCurrentIndex(quizzes.length);
    }
  };

  const currentQuiz = quizzes[currentIndex];
  const isCompleted = currentIndex >= quizzes.length;

  if (loading) {
    return (
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            Quick Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading quiz...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizzes.length === 0 && !started) {
    return (
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Quick Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Brain className="w-12 h-12 mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm text-muted-foreground mb-4">
              Test your knowledge with 3 random questions!
            </p>
            <Button onClick={loadQuiz} className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Start Quick Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    const percentage = Math.round((score / quizzes.length) * 100);
    
    return (
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              percentage >= 80 ? 'bg-green-100 dark:bg-green-900/20' : 
              percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 
              'bg-red-100 dark:bg-red-900/20'
            }`}>
              <span className={`text-3xl font-bold ${
                percentage >= 80 ? 'text-green-600 dark:text-green-400' : 
                percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              }`}>
                {percentage}%
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You got {score} out of {quizzes.length} questions correct
            </p>
            <Button onClick={loadQuiz} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Another Quiz
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Quick Quiz
          </CardTitle>
          <Badge variant="outline">
            {currentIndex + 1}/{quizzes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="mb-4">
            <h4 className="font-semibold mb-3">{currentQuiz.question}</h4>
            <div className="space-y-2">
              {currentQuiz.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuiz.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: showResult ? 1 : 1.02 }}
                    whileTap={{ scale: showResult ? 1 : 0.98 }}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : showWrong
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button onClick={handleNext} className="w-full">
                {currentIndex < quizzes.length - 1 ? 'Next Question' : 'See Results'}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
