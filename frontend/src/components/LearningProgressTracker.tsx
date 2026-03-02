import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Trophy, 
  Target, 
  Zap, 
  CheckCircle,
  TrendingUp,
  Flame,
  Award
} from 'lucide-react';
import { getUserProgress, type UserProgress } from '@/api/progress';
import { formatDistanceToNow } from 'date-fns';

interface LearningProgressTrackerProps {
  userId: string;
  lessonId: string;
  lessonTitle: string;
  totalSections?: number;
  className?: string;
}

interface RealtimeProgress {
  currentSection: number;
  totalSections: number;
  timeSpent: number; // in seconds
  lastActivity: Date;
  completionPercentage: number;
  streak: number;
  isActive: boolean;
}

export function LearningProgressTracker({ 
  userId, 
  lessonId, 
  lessonTitle,
  totalSections = 1,
  className = ''
}: LearningProgressTrackerProps) {
  const [progress, setProgress] = useState<RealtimeProgress>({
    currentSection: 0,
    totalSections: totalSections,
    timeSpent: 0,
    lastActivity: new Date(),
    completionPercentage: 0,
    streak: 0,
    isActive: false
  });
  
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');

  // Track session time
  useEffect(() => {
    setStartTime(new Date());
    setProgress(prev => ({ ...prev, isActive: true }));

    // Update time spent every second
    const timeInterval = setInterval(() => {
      setProgress(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - startTime.getTime()) / 1000),
        lastActivity: new Date()
      }));
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(timeInterval);
      setProgress(prev => ({ ...prev, isActive: false }));
      
      // Save final session time to backend
      const finalTime = Math.floor((Date.now() - startTime.getTime()) / 1000);
      if (finalTime > 10) { // Only save if at least 10 seconds
        saveProgressToBackend(finalTime);
      }
    };
  }, [lessonId]);

  // Fetch initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await getUserProgress(userId);
        const lessonProgress = data.find((p: UserProgress) => p.lessonId === lessonId);
        
        if (lessonProgress) {
          const currentSection = lessonProgress.currentSection || 0;
          const calculatedPercentage = totalSections > 0 
            ? Math.round((currentSection / totalSections) * 100) 
            : 0;
          
          setProgress(prev => ({
            ...prev,
            currentSection: currentSection,
            completionPercentage: calculatedPercentage,
            timeSpent: lessonProgress.timeSpent || 0,
            streak: lessonProgress.streak || 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
  }, [userId, lessonId]);

  // Save progress to backend
  const saveProgressToBackend = async (sessionTime: number) => {
    try {
      // This would be your API call to save progress
      console.log(`[Progress] Saving session: ${sessionTime}s for lesson ${lessonId}`);
      // await updateUserProgress(userId, lessonId, { timeSpent: sessionTime, ... });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Check for milestones
  useEffect(() => {
    // 10 minutes milestone
    if (progress.timeSpent === 600) {
      triggerMilestone('🎯 10 Minutes Focus! Great job!');
    }
    // 30 minutes milestone
    if (progress.timeSpent === 1800) {
      triggerMilestone('🏆 30 Minutes Streak! You\'re on fire!');
    }
    // 1 hour milestone
    if (progress.timeSpent === 3600) {
      triggerMilestone('⭐ 1 Hour Dedication! Outstanding!');
    }
  }, [progress.timeSpent]);

  const triggerMilestone = (message: string) => {
    setMilestoneMessage(message);
    setShowMilestone(true);
    setTimeout(() => setShowMilestone(false), 5000);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <>
      <Card className={`border-2 border-purple-200 dark:border-purple-900/30 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Learning Progress</h3>
                  <p className="text-xs text-muted-foreground">{lessonTitle}</p>
                </div>
              </div>
              {progress.isActive && (
                <Badge className="bg-green-500 text-white animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold">{progress.completionPercentage}%</span>
              </div>
              <Progress value={progress.completionPercentage} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Time Spent */}
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="text-xs font-semibold">{formatTime(progress.timeSpent)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>

              {/* Streak */}
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <Flame className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                <p className="text-xs font-semibold">{progress.streak} days</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>

              {/* Sections */}
              <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <Target className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <p className="text-xs font-semibold">{progress.currentSection}/{progress.totalSections}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </div>

            {/* Last Activity */}
            {progress.lastActivity && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Last activity: {formatDistanceToNow(progress.lastActivity, { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Toast */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="border-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 shadow-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">{milestoneMessage}</p>
                  <p className="text-sm text-muted-foreground">Keep up the great work!</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
