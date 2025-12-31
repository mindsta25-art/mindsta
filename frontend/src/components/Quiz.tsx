import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Trophy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_number: number;
}

interface QuizProps {
  questions: QuizQuestion[];
  quizTitle: string;
  onComplete: (score: number) => void;
  onBackToSubject?: () => void;
  onBackToTopic?: () => void; // Back to lesson/topic
  onBackToClassroom?: () => void; // Back to dashboard/classroom
  // Optional metadata for a richer intro
  lessonTitle?: string;
  subject?: string;
  grade?: string;
  term?: string;
}

export const Quiz = ({ questions, quizTitle, onComplete, onBackToSubject, onBackToTopic, onBackToClassroom, lessonTitle, subject, grade, term }: QuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<string | null>>(new Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  const [overallTimeLeft, setOverallTimeLeft] = useState(600); // 10 minutes (600 seconds) for entire quiz
  const { toast } = useToast();

  // Overall quiz timer - 10 minutes for entire quiz
  useEffect(() => {
    if (quizComplete || !started) return;

    const overallTimer = setInterval(() => {
      setOverallTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(overallTimer);
          handleQuizTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(overallTimer);
  }, [quizComplete, started]);

  // Timer effect - counts down from 60 seconds per question
  useEffect(() => {
    // Don't run timer if quiz is complete or not started
    if (quizComplete || !started) return;

    // Reset timer when question changes
    setTimeLeft(60);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Auto-advance to next question
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quizComplete, started]);

  const handleQuizTimeUp = () => {
    // Overall quiz time expired - auto-submit entire quiz
    toast({
      title: "⏰ Quiz time expired!",
      description: "Submitting your quiz now...",
      variant: "destructive",
    });

    // Submit quiz with current answers
    submitQuiz();
  };

  const handleTimeUp = () => {
    toast({
      title: "⏰ Time's up for this question!",
      description: "Moving to next question...",
    });

    // Auto-advance to next question
    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    // Store the answer immediately
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      // Load previously selected answer for this question if any
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
      setTimeLeft(60); // Reset timer for next question
    } else {
      // Last question - submit quiz
      submitQuiz();
    }
  };

  const submitQuiz = () => {
    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setQuizComplete(true);
    onComplete(finalScore);
  };

  // Pre-quiz introduction screen
  if (!quizComplete && !started) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {subject && <Badge variant="secondary" className="text-sm">{subject}</Badge>}
            {grade && <Badge variant="outline" className="text-sm">Grade {grade}</Badge>}
            {term && <Badge variant="secondary" className="text-sm">{term}</Badge>}
          </div>
          <CardTitle className="text-3xl font-black">{quizTitle || 'Quiz'}</CardTitle>
          {lessonTitle && (
            <CardDescription className="text-base font-semibold">{lessonTitle}</CardDescription>
          )}
          <CardDescription className="text-base">Get ready to show what you know! 🚀</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50 dark:bg-purple-950">
              <div className="text-sm text-muted-foreground">Questions</div>
              <div className="text-2xl font-extrabold">{questions.length}</div>
            </div>
            <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
              <div className="text-sm text-muted-foreground">Total Time</div>
              <div className="text-2xl font-extrabold">10 min</div>
            </div>
            <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-950">
              <div className="text-sm text-muted-foreground">Pass Mark</div>
              <div className="text-2xl font-extrabold">80%</div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-muted p-4 bg-muted/30">
            <div className="font-bold mb-2">Before you start</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>You have 10 minutes to complete the quiz.</li>
              <li>You have 60 seconds per question.</li>
              <li>You won’t see if answers are correct until the end.</li>
              <li>Answer all questions, then submit to see your score.</li>
              <li>Score 80% or higher to pass.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="px-8"
              onClick={() => setConfirmStartOpen(true)}
            >
              Start Quiz
            </Button>
            {onBackToTopic && (
              <Button variant="outline" size="lg" onClick={onBackToTopic}>Back to Topic</Button>
            )}
            {onBackToSubject && (
              <Button variant="outline" size="lg" onClick={onBackToSubject}>Back to Subject</Button>
            )}
            {onBackToClassroom && (
              <Button variant="outline" size="lg" onClick={onBackToClassroom}>Back to Classroom</Button>
            )}
          </div>

          {/* Confirm Start Dialog */}
          <Dialog open={confirmStartOpen} onOpenChange={setConfirmStartOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ready to start?</DialogTitle>
                <DialogDescription>
                  You will have 10 minutes to answer {questions.length} questions. You won’t see which answers are correct until you submit.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• 60 seconds per question</div>
                <div>• No negative marking</div>
                <div>• Make your best choice and keep moving</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmStartOpen(false)}>Not now</Button>
                <Button
                  onClick={() => {
                    setConfirmStartOpen(false);
                    setStarted(true);
                    setCurrentQuestion(0);
                    setSelectedAnswer(userAnswers[0]);
                    setTimeLeft(60);
                    setOverallTimeLeft(600);
                  }}
                >
                  Start Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  if (quizComplete) {
    // Calculate score from user answers
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    const passed = finalScore >= 80;
    
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            {passed ? (
              <div className="mx-auto w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            ) : null}
            <CardTitle className="text-3xl">{passed ? 'Great job! 🎉' : 'Please try again'}</CardTitle>
            <CardDescription className="text-xl">
              You answered {correctCount} of {questions.length} correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-5xl font-bold mb-4 ${passed ? 'text-primary' : 'text-destructive'}`}>{finalScore}%</div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!passed ? (
                // Show all buttons for failed attempts
                <>
                  <Button onClick={() => {
                    // reset state to retake
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setQuizComplete(false);
                    setUserAnswers(new Array(questions.length).fill(null));
                    setTimeLeft(60);
                    setOverallTimeLeft(600);
                  }} size="lg">
                    Try Again
                  </Button>
                  {onBackToTopic && (
                    <Button variant="outline" size="lg" onClick={onBackToTopic}>
                      Back to Topic
                    </Button>
                  )}
                  {onBackToSubject && (
                    <Button variant="outline" size="lg" onClick={onBackToSubject}>
                      Back to Subject
                    </Button>
                  )}
                  {onBackToClassroom && (
                    <Button variant="outline" size="lg" onClick={onBackToClassroom}>
                      Back to Classroom
                    </Button>
                  )}
                </>
              ) : (
                // Only show Back to Classroom for passed (80%+)
                onBackToClassroom && (
                  <Button size="lg" onClick={onBackToClassroom}>
                    Back to Classroom
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review answers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Answers - Review</CardTitle>
            <CardDescription>See which answers you got correct or incorrect</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, idx) => {
              const correct = q.correct_answer;
              const selected = userAnswers[idx];
              const isCorrectSel = selected === correct;
              return (
                <Card key={q.id || idx} className={isCorrectSel ? 'border-green-500' : 'border-red-500'}>
                  <CardContent className="pt-4">
                    <div className="font-semibold mb-2 flex items-start gap-2">
                      {isCorrectSel ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{idx + 1}. {q.question}</span>
                    </div>
                    <div className="space-y-1 ml-7">
                      {q.options.map((opt, oi) => {
                        const isCorrectOpt = opt === correct;
                        const isSelectedOpt = opt === selected;
                        return (
                          <div key={oi} className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${isCorrectOpt ? 'bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700' : isSelectedOpt && !isCorrectOpt ? 'bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700' : ''}`}>
                            {isCorrectOpt && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {isSelectedOpt && !isCorrectOpt && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            {!isCorrectOpt && !isSelectedOpt && (
                              <span className="w-4 h-4" />
                            )}
                            <span className="font-medium">{String.fromCharCode(65 + oi)}.</span>
                            <span className={isCorrectOpt ? 'font-semibold' : ''}>{opt}</span>
                            {isCorrectOpt && (
                              <span className="ml-auto text-xs font-semibold text-green-700 dark:text-green-400">✓ Correct Answer</span>
                            )}
                            {isSelectedOpt && !isCorrectOpt && (
                              <span className="ml-auto text-xs font-semibold text-red-700 dark:text-red-400">✗ Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="mt-3 ml-7 p-3 text-sm bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                        <span className="font-semibold text-blue-900 dark:text-blue-300">💡 Explanation:</span>
                        <span className="text-blue-800 dark:text-blue-200"> {q.explanation}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const timeProgress = (timeLeft / 60) * 100;
  const isTimeRunningOut = timeLeft <= 10;
  
  // Format overall time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const overallTimeProgress = (overallTimeLeft / 600) * 100;
  const isOverallTimeRunningOut = overallTimeLeft <= 60; // Last minute

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        {/* Overall Quiz Timer */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-2 font-bold ${isOverallTimeRunningOut ? 'text-red-600 animate-pulse' : 'text-purple-700 dark:text-purple-300'}`}>
              <Clock className="w-5 h-5" />
              <span className="text-lg">{formatTime(overallTimeLeft)}</span>
            </div>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Overall Quiz Time</span>
          </div>
          <Progress 
            value={overallTimeProgress} 
            className={`h-2 ${isOverallTimeRunningOut ? 'bg-red-100' : 'bg-purple-100'}`}
          />
        </div>

        <div className="flex justify-between items-center mb-2">
          <CardDescription>
            Question {currentQuestion + 1} of {questions.length}
          </CardDescription>
          <CardDescription>
            {userAnswers.filter(a => a !== null).length} answered
          </CardDescription>
        </div>
        
        {/* Question Timer Display */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${isTimeRunningOut ? 'text-red-600 font-bold animate-pulse' : 'text-muted-foreground'}`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
            <span className="text-xs text-muted-foreground">Question time</span>
          </div>
          <Progress 
            value={timeProgress} 
            className={`h-2 ${isTimeRunningOut ? 'bg-red-100' : ''}`}
          />
        </div>

        <CardTitle className="text-2xl">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === option ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-4 px-6"
              onClick={() => handleAnswerSelect(option)}
            >
              <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
              <span className="flex-1">{option}</span>
            </Button>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleNextQuestion} 
            className="w-full" 
            size="lg"
          >
            {currentQuestion < questions.length - 1 ? "Next Question →" : "Submit Quiz ✓"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
