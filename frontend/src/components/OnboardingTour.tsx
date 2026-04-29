import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  BookOpen,
  ShoppingCart,
  Brain,
  TrendingUp,
  Trophy,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Star,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features: { icon: React.ReactNode; text: string }[];
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Mindsta! 🎉',
    description: 'Your all-in-one platform for smarter learning. We\'re excited to have you on board!',
    icon: <Sparkles className="w-14 h-14 text-white" />,
    gradient: 'from-purple-600 to-indigo-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Personalized learning for every grade level' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Track your progress in real-time' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Learn at your own pace, anytime, anywhere' },
    ]
  },
  {
    title: 'Browse & Enroll in lessons',
    description: 'Explore hundreds of lessons organized by grade and subject — from Grade 1 all the way to Common Entrance.',
    icon: <BookOpen className="w-14 h-14 text-white" />,
    gradient: 'from-blue-600 to-cyan-500',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Filter by grade, subject, and term' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Preview lessons before purchasing' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Video lessons, quizzes, and resources included' },
    ]
  },
  {
    title: 'My Learning & Progress',
    description: 'Your personal learning hub — see all enrolled lessons, track completion, and pick up exactly where you left off.',
    icon: <GraduationCap className="w-14 h-14 text-white" />,
    gradient: 'from-teal-500 to-green-500',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'View progress for every lesson at a glance' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Complete quizzes to finish lessons' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Access your full learning history' },
    ]
  },
  {
    title: 'Cart & Wishlist',
    description: 'Found a great lesson? Add it to your cart or save it to your wishlist for later. Enroll in multiple lessons at once and manage your learning journey with ease.',
    icon: <ShoppingCart className="w-14 h-14 text-white" />,
    gradient: 'from-orange-500 to-rose-500',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Add multiple lessons to your cart at once' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Save items to wishlist for later' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Subscribe for unlimited access to all lessons' },
    ]
  },
  {
    title: 'Quick Quiz',
    description: 'Test your knowledge any time with our Quick Quiz feature — 3 random questions drawn from your enrolled lessons.',
    icon: <Brain className="w-14 h-14 text-white" />,
    gradient: 'from-indigo-500 to-violet-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Quick 2-minute knowledge checks' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Instant answer feedback after each question' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Review answers with full explanations' },
    ]
  },
  {
    title: 'Streaks, Badges & Leaderboard',
    description: 'Learning is more fun with rewards! Build streaks, unlock achievements, and compete with fellow students.',
    icon: <Trophy className="w-14 h-14 text-white" />,
    gradient: 'from-yellow-500 to-orange-500',
    features: [
      { icon: <Flame className="w-4 h-4 text-orange-400" />, text: 'Maintain daily streaks to earn bonus coins' },
      { icon: <Star className="w-4 h-4 text-yellow-400" />, text: 'Unlock achievements as you hit milestones' },
      { icon: <Zap className="w-4 h-4 text-blue-400" />, text: 'Climb the leaderboard and show your ranking' },
    ]
  },
  {
    title: 'You\'re all set! 🚀',
    description: 'You\'re ready to start learning. Your first step? Browse lessonss and enroll in a subject you love!',
    icon: <TrendingUp className="w-14 h-14 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Set your grade in Settings for personalized content' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Start with Browse lessonss to find your first lesson' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Come back daily to build your learning streak!' },
    ]
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const hasSeenTour = localStorage.getItem(`onboarding_tour_${user.id}`);
    if (hasSeenTour) return;

    const isNewUserSession = sessionStorage.getItem('isNewRegistration') === 'true';
    if (isNewUserSession) {
      setTimeout(() => {
        setIsOpen(true);
        sessionStorage.removeItem('isNewRegistration');
      }, 1200);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleComplete = () => {
    if (user) localStorage.setItem(`onboarding_tour_${user.id}`, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const step = tourSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleComplete(); }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Getting Started Tour</DialogTitle>
        {/* Hero gradient section */}
        <div className={`bg-gradient-to-br ${step.gradient} px-8 pt-8 pb-6 text-white relative`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleComplete}
            className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/20 rounded-full w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 mb-5">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'flex-1 bg-white' : i < currentStep ? 'w-6 bg-white/60' : 'w-3 bg-white/30'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  {step.icon}
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">{step.title}</h2>
              <p className="text-white/85 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Features section */}
        <div className="px-8 py-6 bg-background">
          <AnimatePresence mode="wait">
            <motion.ul
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="space-y-3 mb-6"
            >
              {step.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="flex-shrink-0">{feature.icon}</div>
                  <span className="text-muted-foreground">{feature.text}</span>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className={`flex-1 gap-2 bg-gradient-to-r ${step.gradient} text-white hover:opacity-90 border-0`}
            >
              {currentStep === tourSteps.length - 1 ? (
                <>Let's Go! <Zap className="w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
