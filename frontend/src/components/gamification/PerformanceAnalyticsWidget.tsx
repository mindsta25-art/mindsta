import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Clock, Award } from 'lucide-react';

interface WeeklyActivity {
  date: string;
  dayName: string;
  minutes: number;
  lessonsCompleted: number;
}

interface SubjectPerformance {
  subject: string;
  completed: number;
  total: number;
  percentage: number;
}

interface PerformanceAnalyticsProps {
  weeklyActivity: WeeklyActivity[];
  subjectPerformance: SubjectPerformance[];
  avgMinutesPerDay: number;
  totalStudyMinutes: number;
  strongest: SubjectPerformance | null;
  weakest: SubjectPerformance | null;
}

export const PerformanceAnalyticsWidget = ({
  weeklyActivity,
  subjectPerformance,
  avgMinutesPerDay,
  totalStudyMinutes,
  strongest,
  weakest,
}: PerformanceAnalyticsProps) => {
  const maxMinutes = Math.max(...weeklyActivity.map(d => d.minutes), 1);
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMinutes = totalStudyMinutes % 60;

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Learning Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Weekly Activity Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3">This Week's Activity</h4>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyActivity.map((day, idx) => {
                const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                const isToday = idx === 6;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="flex-1 w-full flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`w-full rounded-t-lg ${
                          isToday
                            ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                            : day.minutes > 0
                            ? 'bg-gradient-to-t from-indigo-400 to-purple-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        title={`${day.minutes} minutes, ${day.lessonsCompleted} lessons`}
                      />
                    </div>
                    <span className={`text-xs ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                      {day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Study Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-muted-foreground">Avg. Daily</span>
              </div>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {avgMinutesPerDay}m
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-muted-foreground">Total Time</span>
              </div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {totalHours}h {remainingMinutes}m
              </p>
            </div>
          </div>

          {/* Top Subject */}
          {strongest && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-900 dark:text-green-100">
                      Strongest Subject
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{strongest.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {strongest.completed}/{strongest.total} completed
                  </p>
                </div>
                <Badge className="bg-green-600 text-white">
                  {strongest.percentage}%
                </Badge>
              </div>
            </div>
          )}

          {/* Needs Attention Subject */}
          {weakest && weakest.percentage < 70 && (
            <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                      Needs Attention
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{weakest.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {weakest.completed}/{weakest.total} completed
                  </p>
                </div>
                <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                  {weakest.percentage}%
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
