import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface StudyDay {
  date: string;
  minutes: number;
}

interface StudyTimeHeatmapProps {
  studyData: StudyDay[]; // Last 30 days
}

export const StudyTimeHeatmap = ({ studyData }: StudyTimeHeatmapProps) => {
  // Generate last 30 days
  const days: { date: Date; minutes: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dataPoint = studyData.find(d => {
      const studyDate = new Date(d.date);
      studyDate.setHours(0, 0, 0, 0);
      return studyDate.getTime() === date.getTime();
    });
    
    days.push({
      date,
      minutes: dataPoint?.minutes || 0,
    });
  }

  // Calculate intensity (0-4 based on minutes)
  const getIntensity = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes <= 15) return 1;
    if (minutes <= 30) return 2;
    if (minutes <= 60) return 3;
    return 4;
  };

  const getColorClass = (intensity: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-green-200 dark:bg-green-900',
      'bg-green-300 dark:bg-green-700',
      'bg-green-500 dark:bg-green-600',
      'bg-green-600 dark:bg-green-500',
    ];
    return colors[intensity];
  };

  // Group by weeks
  type DayData = { date: Date; minutes: number };
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  
  days.forEach((day, idx) => {
    currentWeek.push(day);
    if (day.date.getDay() === 6 || idx === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          Study Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Month Label */}
          <div className="text-xs font-medium text-muted-foreground">{currentMonth}</div>
          
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => {
                    const intensity = getIntensity(day.minutes);
                    const colorClass = getColorClass(intensity);
                    
                    return (
                      <motion.div
                        key={dayIdx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (weekIdx * 7 + dayIdx) * 0.01 }}
                        className={`w-3 h-3 rounded-sm ${colorClass} cursor-pointer hover:ring-2 hover:ring-green-500 transition-all`}
                        title={`${day.date.toLocaleDateString()}: ${day.minutes} minutes`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded-sm ${getColorClass(intensity)}`}
              />
            ))}
            <span>More</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="text-muted-foreground text-xs">Active Days</div>
              <div className="font-semibold">
                {days.filter(d => d.minutes > 0).length}/30
              </div>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="text-muted-foreground text-xs">Longest Streak</div>
              <div className="font-semibold">
                {(() => {
                  let maxStreak = 0;
                  let currentStreak = 0;
                  days.forEach(day => {
                    if (day.minutes > 0) {
                      currentStreak++;
                      maxStreak = Math.max(maxStreak, currentStreak);
                    } else {
                      currentStreak = 0;
                    }
                  });
                  return maxStreak;
                })()} days
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
