import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, CheckCircle2, TrendingUp, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface WeeklyGoalProps {
  dailyGoal: number;
  enabled: boolean;
  completedToday: number;
  weekProgress: boolean[]; // 7 days
  onUpdateGoal: (dailyLessons: number, enabled: boolean) => void;
}

export const WeeklyGoalWidget = ({
  dailyGoal,
  enabled,
  completedToday,
  weekProgress,
  onUpdateGoal,
}: WeeklyGoalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal);
  const [goalEnabled, setGoalEnabled] = useState(enabled);

  const handleSave = () => {
    onUpdateGoal(newGoal, goalEnabled);
    setIsOpen(false);
  };

  const daysCompleted = weekProgress.filter(Boolean).length;
  const todayProgress = Math.min((completedToday / dailyGoal) * 100, 100);
  const isGoalMetToday = completedToday >= dailyGoal;

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-200 dark:border-blue-900/30">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Weekly Goal
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Your Weekly Goal</DialogTitle>
                <DialogDescription>
                  Choose how many lessons you want to complete each day
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Enable Goals</Label>
                    <Switch checked={goalEnabled} onCheckedChange={setGoalEnabled} />
                  </div>
                </div>
                {goalEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Daily Lessons Target</Label>
                      <span className="text-2xl font-bold text-blue-600">{newGoal}</span>
                    </div>
                    <Slider
                      value={[newGoal]}
                      onValueChange={(value) => setNewGoal(value[0])}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set a realistic goal you can achieve daily
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Goal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {enabled ? (
          <div className="space-y-4">
            {/* Today's Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Today's Progress</span>
                <span className="text-sm font-semibold">
                  {completedToday}/{dailyGoal}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    isGoalMetToday
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${todayProgress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              {isGoalMetToday && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 text-green-600 dark:text-green-400"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Goal achieved! 🎉</span>
                </motion.div>
              )}
            </div>

            {/* Week Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <Badge variant={daysCompleted >= 5 ? "default" : "outline"}>
                  {daysCompleted}/7 days
                </Badge>
              </div>
              <div className="flex gap-2">
                {weekProgress.map((completed, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center ${
                      completed
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Motivation Message */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
              <p className="text-sm text-center">
                {daysCompleted >= 7 ? (
                  <span className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    Perfect week! You're on fire! 🔥
                  </span>
                ) : daysCompleted >= 5 ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    Amazing work! Keep the momentum going! 💪
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {7 - daysCompleted} more {7 - daysCompleted === 1 ? 'day' : 'days'} to go. You got this!
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Set a weekly goal to track your progress!
            </p>
            <Button onClick={() => setIsOpen(true)}>Set Goal</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
