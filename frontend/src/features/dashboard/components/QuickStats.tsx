/**
 * Quick Stats Component - Displays learning statistics cards with enhanced visuals
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked, Target, Flame, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LearningStats } from '../hooks/useLearningStats';

interface QuickStatsProps {
  stats: LearningStats | null;
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

const QuickStatsComponent = ({ stats }: QuickStatsProps) => {
  if (!stats) return null;

  // Mock trend data (in production, calculate from historical data)
  const getTrend = (value: number, label: string) => {
    if (label === 'Streak' && value >= 5) return { direction: 'up', percent: 15 };
    if (label === 'Avg Score' && parseInt(String(value)) >= 80) return { direction: 'up', percent: 12 };
    if (label === 'Lessons') return { direction: 'up', percent: 8 };
    if (label === 'Points') return { direction: 'up', percent: 10 };
    return { direction: 'neutral', percent: 0 };
  };

  const statCards = [
    {
      label: 'Lessons',
      value: stats.totalLessonsCompleted,
      icon: BookMarked,
      color: 'blue',
      subtitle: 'Completed'
    },
    {
      label: 'Avg Score',
      value: `${stats.averageScore}%`,
      icon: Target,
      color: 'green',
      subtitle: 'Success Rate'
    },
    {
      label: 'Streak',
      value: stats.currentStreak,
      icon: Flame,
      color: 'orange',
      subtitle: 'Days Active'
    },
    {
      label: 'Points',
      value: stats.pointsEarned,
      icon: Trophy,
      color: 'indigo',
      subtitle: 'Total Earned'
    }
  ];

  const colorClasses = {
    blue: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/20'
    },
    green: { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-500 to-green-600',
      glow: 'shadow-green-500/20'
    },
    orange: { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      text: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-500 to-orange-600',
      glow: 'shadow-orange-500/20'
    },
    indigo: { 
      bg: 'bg-indigo-100 dark:bg-indigo-900/30', 
      text: 'text-indigo-600 dark:text-indigo-400',
      gradient: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/20'
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12"
      role="region"
      aria-label="Learning statistics"
    >
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const colors = colorClasses[stat.color as keyof typeof colorClasses];
        const trend = getTrend(typeof stat.value === 'number' ? stat.value : parseInt(String(stat.value)), stat.label);
        
        const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;

        return (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className={`hover:shadow-xl transition-all duration-300 border-0 ${colors.glow} hover:shadow-2xl overflow-hidden relative`}>
              {/* Animated gradient background */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-[0.03]`}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.03, 0.05, 0.03]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex items-start justify-between mb-3">
                  <motion.div 
                    className={`p-2 sm:p-2.5 ${colors.bg} rounded-xl shadow-sm`} 
                    aria-hidden="true"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
                  </motion.div>
                  
                  {/* Trend indicator */}
                  {trend.direction !== 'neutral' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        trend.direction === 'up' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      <TrendIcon className="w-3 h-3" />
                      <span>{trend.percent}%</span>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                    {stat.label}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stat.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                      aria-label={`${stat.label}: ${stat.value}`}
                    >
                      {stat.value}
                    </motion.div>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>

                {/* Mini sparkline effect */}
                <div className="mt-3 flex gap-0.5 h-1">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`flex-1 rounded-full ${colors.bg}`}
                      initial={{ scaleY: 0.3 }}
                      animate={{ 
                        scaleY: Math.random() * 0.7 + 0.3,
                      }}
                      transition={{
                        duration: 1,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export const QuickStats = memo(QuickStatsComponent);
