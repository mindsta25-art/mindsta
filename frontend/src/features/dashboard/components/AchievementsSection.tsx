/**
 * Achievements Section - Displays badges, milestones, and learning streaks
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Flame,
  Star,
  Award,
  Target,
  BookOpen,
  Zap,
  Crown,
  Medal,
  Calendar
} from 'lucide-react';
import type { LearningStats } from '../hooks/useLearningStats';

interface AchievementsSectionProps {
  stats: LearningStats | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  progress: number;
  unlocked: boolean;
  points: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AchievementsSectionComponent = ({ stats }: AchievementsSectionProps) => {
  if (!stats) return null;

  // Generate achievements based on stats
  const achievements: Achievement[] = [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      progress: stats.totalLessonsCompleted >= 1 ? 100 : 0,
      unlocked: stats.totalLessonsCompleted >= 1,
      points: 50
    },
    {
      id: 'streak-3',
      title: 'On Fire!',
      description: 'Maintain a 3-day streak',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      progress: Math.min((stats.currentStreak / 3) * 100, 100),
      unlocked: stats.currentStreak >= 3,
      points: 100
    },
    {
      id: 'lessons-10',
      title: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      progress: Math.min((stats.totalLessonsCompleted / 10) * 100, 100),
      unlocked: stats.totalLessonsCompleted >= 10,
      points: 200
    },
    {
      id: 'score-90',
      title: 'Excellence',
      description: 'Score 90% or above',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      progress: stats.averageScore >= 90 ? 100 : (stats.averageScore / 90) * 100,
      unlocked: stats.averageScore >= 90,
      points: 150
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      progress: Math.min((stats.currentStreak / 7) * 100, 100),
      unlocked: stats.currentStreak >= 7,
      points: 300
    },
    {
      id: 'points-1000',
      title: 'Point Master',
      description: 'Earn 1000 points',
      icon: Crown,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      progress: Math.min((stats.pointsEarned / 1000) * 100, 100),
      unlocked: stats.pointsEarned >= 1000,
      points: 500
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  // Generate streak calendar (last 7 days)
  const streakCalendar = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = 6 - i;
    return {
      day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(Date.now() - dayIndex * 86400000).getDay()],
      active: dayIndex < stats.currentStreak
    };
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-8 sm:mb-12"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Achievements & Streaks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unlockedCount} of {achievements.length} unlocked • {totalPoints} points earned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Trophy className="w-3 h-3" />
            Level {Math.floor(stats.pointsEarned / 100) + 1}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Achievements Grid */}
        <div className="lg:col-span-2">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
          >
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              
              return (
                <motion.div
                  key={achievement.id}
                  variants={fadeInUp}
                  whileHover={{ scale: achievement.unlocked ? 1.05 : 1.02, y: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card 
                    className={`h-full transition-all duration-300 ${
                      achievement.unlocked 
                        ? 'border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl' 
                        : 'opacity-60 grayscale hover:grayscale-0'
                    }`}
                  >
                    <CardContent className="p-4 relative">
                      {achievement.unlocked && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', delay: 0.2 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Award className="w-4 h-4 text-white" />
                          </div>
                        </motion.div>
                      )}

                      <motion.div
                        className={`w-14 h-14 ${achievement.bgColor} rounded-xl flex items-center justify-center mb-3 mx-auto`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className={`w-7 h-7 ${achievement.color}`} />
                      </motion.div>

                      <h3 className="font-bold text-sm text-center mb-1">
                        {achievement.title}
                      </h3>
                      <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-2">
                        {achievement.description}
                      </p>

                      {/* Progress bar */}
                      {!achievement.unlocked && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{Math.round(achievement.progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${achievement.progress}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )}

                      {achievement.unlocked && (
                        <div className="flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600">
                          <Medal className="w-3 h-3" />
                          {achievement.points} pts
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Streak Calendar */}
        <div>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Flame className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold">Current Streak</h3>
                  <p className="text-xs text-muted-foreground">Keep it going!</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
                >
                  {stats.currentStreak}
                </motion.div>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>

              {/* Week calendar */}
              <div className="flex justify-between gap-2 mb-4">
                {streakCalendar.map((day, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1"
                  >
                    <div className="text-center">
                      <div
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-semibold mb-1 transition-all ${
                          day.active
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {day.active && <Flame className="w-4 h-4" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Streak milestones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Next milestone:</span>
                  <span className="font-semibold">7 days</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.currentStreak / 7) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Calendar icon at bottom */}
              <div className="mt-6 pt-4 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Study every day to grow your streak</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export const AchievementsSection = memo(AchievementsSectionComponent);
