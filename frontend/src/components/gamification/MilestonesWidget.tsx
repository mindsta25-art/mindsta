import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Rocket, Map, BookOpen, Award, Crown, Sparkles } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: number;
  coinReward: number;
  icon: string;
  gradient: string;
  achievedAt?: string;
}

interface MilestonesWidgetProps {
  completedLessons: number;
  achievedMilestones: Milestone[];
  nextMilestone: Milestone | null;
}

const iconMap: Record<string, any> = {
  Rocket,
  Map,
  BookOpen,
  Award,
  Trophy,
  Crown,
};

export const MilestonesWidget = ({
  completedLessons,
  achievedMilestones = [],
  nextMilestone,
}: MilestonesWidgetProps) => {
  const progressToNext = nextMilestone
    ? Math.min(100, Math.round((completedLessons / nextMilestone.requirement) * 100))
    : 100;

  const latestAchieved = achievedMilestones[achievedMilestones.length - 1];

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-yellow-200 dark:border-yellow-900/30">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          Progress Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Current Progress */}
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block mb-3"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {completedLessons}
              </div>
            </motion.div>
            <p className="text-sm text-muted-foreground">Lessons Completed</p>
            <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
              {achievedMilestones.length} Milestones Reached
            </Badge>
          </div>

          {/* Latest Achievement */}
          {latestAchieved && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${latestAchieved.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                  {(() => {
                    const IconComponent = iconMap[latestAchieved.icon] || Trophy;
                    return <IconComponent className="w-6 h-6 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{latestAchieved.name}</h4>
                    <Sparkles className="w-3 h-3 text-yellow-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">Latest achievement</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Next Milestone */}
          {nextMilestone ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Milestone</span>
                <Badge variant="outline">
                  {completedLessons}/{nextMilestone.requirement}
                </Badge>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${nextMilestone.gradient} rounded-lg flex items-center justify-center opacity-70`}>
                    {(() => {
                      const IconComponent = iconMap[nextMilestone.icon] || Trophy;
                      return <IconComponent className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{nextMilestone.name}</h4>
                    <p className="text-xs text-muted-foreground">{nextMilestone.description}</p>
                  </div>
                </div>
                <Progress value={progressToNext} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{progressToNext}% complete</span>
                  <span>{nextMilestone.requirement - completedLessons} lessons to go</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 px-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
              <Crown className="w-10 h-10 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
              <h4 className="font-semibold mb-1">All Milestones Completed!</h4>
              <p className="text-xs text-muted-foreground">
                You've achieved every milestone. Amazing work! 🎉
              </p>
            </div>
          )}

          {/* Milestone History */}
          {achievedMilestones.length > 0 && (
            <div className="pt-2 border-t">
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                Achievement History
              </h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {achievedMilestones.slice().reverse().map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-6 h-6 bg-gradient-to-br ${milestone.gradient} rounded flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const IconComponent = iconMap[milestone.icon] || Trophy;
                        return <IconComponent className="w-3 h-3 text-white" />;
                      })()}
                    </div>
                    <span className="flex-1 truncate">{milestone.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(milestone.achievedAt!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
