import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Award, TrendingUp } from 'lucide-react';

interface MasteryLevel {
  level: string;
  xpRequired: number;
  color: string;
}

interface SubjectMastery {
  subject: string;
  level: string;
  xp: number;
  lessonsCompleted: number;
  currentLevelInfo: MasteryLevel;
  nextLevel: {
    level: string;
    xpRequired: number;
    xpToGo: number;
    progress: number;
  } | null;
}

interface SubjectMasteryWidgetProps {
  mastery: SubjectMastery[];
}

const levelColors: Record<string, { bg: string; text: string; icon: string }> = {
  Beginner: {
    bg: 'from-gray-400 to-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
    icon: '🌱',
  },
  Intermediate: {
    bg: 'from-blue-400 to-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '🌿',
  },
  Advanced: {
    bg: 'from-purple-400 to-purple-600',
    text: 'text-purple-700 dark:text-purple-300',
    icon: '🌳',
  },
  Master: {
    bg: 'from-yellow-400 to-orange-500',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: '👑',
  },
};

export const SubjectMasteryWidget = ({ mastery }: SubjectMasteryWidgetProps) => {
  const sortedMastery = [...mastery].sort((a, b) => b.xp - a.xp);
  const topSubject = sortedMastery[0];

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Subject Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {mastery.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Complete lessons to unlock subject mastery!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Subject Highlight */}
            {topSubject && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-900"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{levelColors[topSubject.level].icon}</span>
                      <h3 className="font-bold text-lg">{topSubject.subject}</h3>
                    </div>
                    <Badge className={`bg-gradient-to-r ${levelColors[topSubject.level].bg} border-0 text-white`}>
                      {topSubject.level}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {topSubject.xp}
                    </div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                </div>
                {topSubject.nextLevel && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Progress to {topSubject.nextLevel.level}
                      </span>
                      <span className="font-semibold">
                        {topSubject.nextLevel.xpToGo} XP to go
                      </span>
                    </div>
                    <Progress value={topSubject.nextLevel.progress} className="h-2" />
                  </div>
                )}
              </motion.div>
            )}

            {/* Other Subjects */}
            <div className="space-y-3">
              {sortedMastery.slice(1).map((subject, idx) => (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{levelColors[subject.level].icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{subject.subject}</h4>
                        <p className="text-xs text-muted-foreground">
                          {subject.lessonsCompleted} lessons • {subject.xp} XP
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={levelColors[subject.level].text}>
                      {subject.level}
                    </Badge>
                  </div>
                  {subject.nextLevel && (
                    <div className="space-y-1">
                      <Progress value={subject.nextLevel.progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>To {subject.nextLevel.level}</span>
                        <span>{subject.nextLevel.progress}%</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Mastery Stats */}
            <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-lg font-bold text-yellow-600">
                  {mastery.filter(m => m.level === 'Master').length}
                </div>
                <div className="text-xs text-muted-foreground">Mastered</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-lg font-bold text-purple-600">
                  {mastery.filter(m => m.level === 'Advanced').length}
                </div>
                <div className="text-xs text-muted-foreground">Advanced</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-lg font-bold text-blue-600">
                  {mastery.reduce((sum, m) => sum + m.xp, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
