/**
 * Learning Analytics Component - Visual charts and insights
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';
import type { LearningStats } from '../hooks/useLearningStats';

interface LearningAnalyticsProps {
  stats: LearningStats | null;
  weeklySeries?: number[];
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const LearningAnalyticsComponent = ({ stats, weeklySeries = [] }: LearningAnalyticsProps) => {
  if (!stats) return null;

  // Mock data for demonstration (in production, calculate from actual data)
  const weeklyData = weeklySeries.length > 0 ? weeklySeries : [3, 5, 4, 7, 6, 8, 5];
  const maxWeeklyValue = Math.max(...weeklyData, 10);
  
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Subject performance (mock data - in production, calculate from user progress)
  const subjectPerformance = [
    { subject: 'Mathematics', score: 85, lessons: 12, color: 'bg-blue-500' },
    { subject: 'English', score: 92, lessons: 15, color: 'bg-green-500' },
    { subject: 'Science', score: 78, lessons: 10, color: 'bg-purple-500' },
    { subject: 'ICT', score: 88, lessons: 8, color: 'bg-orange-500' }
  ];

  // Learning insights
  const insights = [
    {
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
      title: 'Great Progress!',
      description: `You've completed ${stats.totalLessonsCompleted} lessons this month`
    },
    {
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      title: 'High Performance',
      description: `Your average score is ${stats.averageScore}%`
    },
    {
      icon: Zap,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      title: 'Consistent Learner',
      description: `${stats.currentStreak} day streak - keep it up!`
    }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mb-8 sm:mb-12"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Learning Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your progress and performance
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <BarChart3 className="w-3 h-3" />
          Last 7 Days
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Weekly Activity</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{weeklyData.reduce((a, b) => a + b, 0)} lessons</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end justify-between gap-2 h-48 mb-4">
                {weeklyData.map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg relative group cursor-pointer"
                      initial={{ height: 0 }}
                      animate={{ height: `${(value / maxWeeklyValue) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {value} lessons
                        </div>
                      </div>
                    </motion.div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {daysOfWeek[index]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subject Performance */}
              <div className="pt-6 border-t">
                <h4 className="font-semibold mb-4">Subject Performance</h4>
                <div className="space-y-3">
                  {subjectPerformance.map((subject, index) => (
                    <motion.div
                      key={subject.subject}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-2 h-2 rounded-full ${subject.color}`} />
                          <span className="text-sm font-medium">{subject.subject}</span>
                          <span className="text-xs text-muted-foreground">
                            ({subject.lessons} lessons)
                          </span>
                        </div>
                        <span className="text-sm font-bold">{subject.score}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${subject.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.score}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <div>
          <Card className="h-full">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Your Insights</h3>
              <div className="space-y-4">
                {insights.map((insight, index) => {
                  const Icon = insight.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 ${insight.bg} rounded-lg flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${insight.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Study streak visualization */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-sm mb-3">Study Pattern</h4>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 28 }, (_, i) => {
                    const intensity = Math.floor(Math.random() * 4);
                    const colors = [
                      'bg-muted',
                      'bg-green-200 dark:bg-green-900/40',
                      'bg-green-400 dark:bg-green-700/60',
                      'bg-green-600 dark:bg-green-500'
                    ];
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className={`aspect-square rounded-sm ${colors[intensity]} cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all`}
                        title={`Day ${i + 1}`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-muted" />
                    <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
                    <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/60" />
                    <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export const LearningAnalytics = memo(LearningAnalyticsComponent);
