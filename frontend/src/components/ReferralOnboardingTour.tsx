import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Gift,
  Link,
  Users,
  DollarSign,
  ClipboardList,
  Landmark,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  CheckCircle,
  Star,
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
    title: 'Welcome to the Referral Program! 🎉',
    description: 'You\'re now part of the Mindsta Referral Program — earn real money every time someone you refer makes a payment.',
    icon: <Gift className="w-14 h-14 text-white" />,
    gradient: 'from-yellow-500 to-orange-500',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Earn a commission on every referral payment' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'No cap on how much you can earn' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Track everything from one simple dashboard' },
    ],
  },
  {
    title: 'Your Unique Referral Link',
    description: 'Every referral starts with your personal link or code. Share it anywhere — social media, WhatsApp, email, or word of mouth.',
    icon: <Link className="w-14 h-14 text-white" />,
    gradient: 'from-blue-600 to-cyan-500',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Copy your link with one click' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Share your referral code directly' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Link is always available on your dashboard' },
    ],
  },
  {
    title: 'Track Your Referrals',
    description: 'See exactly who signed up using your link, when they joined, and the status of their account — all in real time.',
    icon: <Users className="w-14 h-14 text-white" />,
    gradient: 'from-teal-500 to-green-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'View a full list of your referred users' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'See which referrals have converted to paying users' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Monitor active vs. pending referrals' },
    ],
  },
  {
    title: 'Earn Commissions',
    description: 'You earn a percentage every time a referred user makes a payment on Mindsta. The more you refer, the more you earn.',
    icon: <DollarSign className="w-14 h-14 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      { icon: <Star className="w-4 h-4 text-yellow-400" />, text: 'Commission credited automatically per payment' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Earnings accumulate in your referral balance' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'No limit on the number of referrals you can make' },
    ],
  },
  {
    title: 'Commission History',
    description: 'Every commission you earn is logged here. Get a full breakdown — dates, amounts, and which referral triggered it.',
    icon: <ClipboardList className="w-14 h-14 text-white" />,
    gradient: 'from-indigo-500 to-violet-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'View all earnings with full transaction details' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Filter by date range or status' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Monitor pending vs. confirmed commissions' },
    ],
  },
  {
    title: 'Request Payouts',
    description: 'Once your balance reaches the minimum threshold, you can request a payout directly to your bank account.',
    icon: <Landmark className="w-14 h-14 text-white" />,
    gradient: 'from-pink-500 to-rose-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Add your bank details in Settings' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Submit a withdrawal request in seconds' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Track the status of each payout request' },
    ],
  },
  {
    title: 'You\'re ready to earn! 🚀',
    description: 'That\'s everything you need to get started. Share your link, build your network, and watch your earnings grow.',
    icon: <Rocket className="w-14 h-14 text-white" />,
    gradient: 'from-purple-600 to-indigo-600',
    features: [
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Share your referral link right now' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Add bank details so payouts are ready to go' },
      { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Check your dashboard daily for new commissions' },
    ],
  },
];

interface ReferralOnboardingTourProps {
  onComplete?: () => void;
}

export const ReferralOnboardingTour = ({ onComplete }: ReferralOnboardingTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const hasSeenTour = localStorage.getItem(`referral_onboarding_tour_${user.id}`);
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
    if (user) localStorage.setItem(`referral_onboarding_tour_${user.id}`, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const step = tourSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleComplete(); }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
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
