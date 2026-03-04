import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, BookOpen, Star } from 'lucide-react';

export function VerifySuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => navigate('/student-home'), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-card rounded-3xl shadow-2xl overflow-hidden text-center">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10">
            <div className="relative inline-flex justify-center">
              {/* Outer ring pulse */}
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-white/20 animate-ping" />
              <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-white">Email Verified! 🎉</h1>
            <p className="mt-1 text-green-100 text-sm">Welcome to Mindsta, {firstName}!</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Your account is now fully activated. You're ready to start your learning journey!
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '📚', label: 'Access all courses' },
                { icon: '🏆', label: 'Earn achievements' },
                { icon: '📊', label: 'Track progress' },
              ].map(({ icon, label }) => (
                <div key={label} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-3 flex flex-col items-center gap-1">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs text-center text-muted-foreground font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Auto-redirect notice */}
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Taking you to your dashboard in a few seconds...
              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
              onClick={() => navigate('/student-home')}
            >
              <BookOpen className="w-5 h-5" />
              Go to My Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Confetti-style decorations */}
        <div className="flex justify-center gap-2 mt-4">
          {['⭐', '🎯', '🚀', '✨', '🎓'].map((emoji, i) => (
            <span key={i} className="text-xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
              {emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VerifySuccess;
