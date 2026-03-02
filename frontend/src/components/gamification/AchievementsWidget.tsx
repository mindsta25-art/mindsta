import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Lock, ChevronRight, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  coinReward: number;
  gradient: string;
  isUnlocked: boolean;
  progress: number;
  progressPercentage: number;
}

interface AchievementsWidgetProps {
  achievements: Achievement[];
  totalCoins: number;
}

const iconMap: Record<string, any> = {
  CheckCircle: Award,
  Zap: Award,
  Calendar: Award,
  Trophy: Award,
  Award: Award,
  BookOpen: Award,
  Flame: Award,
  Star: Award,
  Sun: Award,
  Moon: Award,
  Clock: Award,
};

export const AchievementsWidget = ({ achievements, totalCoins }: AchievementsWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const recentAchievements = achievements.filter(a => a.isUnlocked).slice(-3);
  const inProgress = achievements
    .filter(a => !a.isUnlocked && a.progress > 0)
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, 3);

  return (
    <>
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Achievements
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                <Coins className="w-3 h-3 mr-1" />
                {totalCoins}
              </Badge>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>All Achievements</DialogTitle>
                    <DialogDescription>
                      {unlockedCount} of {achievements.length} unlocked
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    {achievements.map((achievement, idx) => {
                      const IconComponent = iconMap[achievement.icon] || Award;
                      
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-4 rounded-lg border-2 ${
                            achievement.isUnlocked
                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800'
                              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${achievement.gradient} rounded-lg flex items-center justify-center flex-shrink-0 ${
                              !achievement.isUnlocked && 'opacity-50 grayscale'
                            }`}>
                              {achievement.isUnlocked ? (
                                <IconComponent className="w-6 h-6 text-white" />
                              ) : (
                                <Lock className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <h4 className="font-semibold">{achievement.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {achievement.description}
                                  </p>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  <Coins className="w-3 h-3 mr-1" />
                                  {achievement.coinReward}
                                </Badge>
                              </div>
                              {!achievement.isUnlocked && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progress</span>
                                    <span>{achievement.progress}/{achievement.requirement}</span>
                                  </div>
                                  <Progress value={achievement.progressPercentage} className="h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Recent Achievements */}
            {recentAchievements.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold mb-2">Recently Unlocked</h4>
                {recentAchievements.map((achievement, idx) => {
                  const IconComponent = iconMap[achievement.icon] || Award;
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${achievement.gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{achievement.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          +{achievement.coinReward} coins
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            ) : null}

            {/* In Progress */}
            {inProgress.length > 0 && (
              <>
                <h4 className="text-sm font-semibold mb-2 mt-4">In Progress</h4>
                {inProgress.map((achievement) => (
                  <div key={achievement.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{achievement.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.requirement}
                      </span>
                    </div>
                    <Progress value={achievement.progressPercentage} className="h-2" />
                  </div>
                ))}
              </>
            )}

            {recentAchievements.length === 0 && inProgress.length === 0 && (
              <div className="text-center py-4">
                <Award className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Complete lessons to unlock achievements!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
