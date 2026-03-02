import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  Award,
  Lock,
  CheckCircle,
  Coins,
  Trophy,
  Star,
  Flame,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getAchievements, getGamificationStats } from '@/api/gamification';
import type { Achievement } from '@/api/gamification';

// Map icon string names to lucide components
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  CheckCircle, Zap, Flame, Trophy, Award, Star, Target, TrendingUp,
  Calendar: Award, BookOpen: Award, Sun: Award, Moon: Award, Clock: Award,
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const AchievementsPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [tab, setTab] = useState<'all' | 'unlocked' | 'inprogress' | 'locked'>('all');

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [achData, statsData] = await Promise.all([
          getAchievements(),
          getGamificationStats(),
        ]);
        setAchievements(achData?.achievements || []);
        setTotalCoins(statsData?.coins ?? 0);
      } catch (err) {
        console.error('Error loading achievements:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const unlocked = achievements.filter(a => a.isUnlocked);
  const inProgress = achievements.filter(a => !a.isUnlocked && a.progress > 0);
  const locked = achievements.filter(a => !a.isUnlocked && a.progress === 0);

  const getTabList = (): Achievement[] => {
    switch (tab) {
      case 'unlocked': return unlocked;
      case 'inprogress': return inProgress;
      case 'locked': return locked;
      default: return achievements;
    }
  };

  const completionPct = achievements.length > 0
    ? Math.round((unlocked.length / achievements.length) * 100)
    : 0;

  // Coin rewards earned
  const coinsEarned = unlocked.reduce((sum, a) => sum + a.coinReward, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />

      <main className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl mt-20">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white overflow-hidden shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Trophy className="w-9 h-9 text-yellow-300" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">Achievements</h1>
                    <p className="text-purple-200 text-sm">
                      {loading ? '—' : `${unlocked.length} of ${achievements.length} unlocked`}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{loading ? '—' : unlocked.length}</p>
                    <p className="text-xs text-purple-200 uppercase tracking-wide">Unlocked</p>
                  </div>
                  <div className="w-px bg-white/20 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{loading ? '—' : coinsEarned}</p>
                    <p className="text-xs text-purple-200 uppercase tracking-wide flex items-center gap-1">
                      <Coins className="w-3 h-3" />Coins Earned
                    </p>
                  </div>
                  <div className="w-px bg-white/20 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{loading ? '—' : `${completionPct}%`}</p>
                    <p className="text-xs text-purple-200 uppercase tracking-wide">Complete</p>
                  </div>
                </div>
              </div>

              {/* Overall progress bar */}
              {!loading && achievements.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-purple-200 mb-2">
                    <span>Overall Progress</span>
                    <span>{unlocked.length}/{achievements.length}</span>
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recently Unlocked strip */}
        {!loading && unlocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h2 className="font-bold text-lg">Recently Unlocked</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {[...unlocked].reverse().slice(0, 6).map((ach) => {
                const Icon = iconMap[ach.icon] || Award;
                return (
                  <div
                    key={ach.id}
                    className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group cursor-default"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ach.gradient} flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-800`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-center leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {ach.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="mb-6 grid grid-cols-4 w-full max-w-lg bg-purple-100 dark:bg-purple-900/30">
              <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                All{!loading && <span className="ml-1.5 text-xs text-muted-foreground">({achievements.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="unlocked" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                ✓ Done{!loading && <span className="ml-1 text-xs text-muted-foreground">({unlocked.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="inprogress" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                Active{!loading && <span className="ml-1 text-xs text-muted-foreground">({inProgress.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="locked" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                Locked{!loading && <span className="ml-1 text-xs text-muted-foreground">({locked.length})</span>}
              </TabsTrigger>
            </TabsList>

            {(['all', 'unlocked', 'inprogress', 'locked'] as const).map((t) => (
              <TabsContent key={t} value={t}>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-2 w-full rounded-full" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : getTabList().length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t === 'unlocked' ? 'No achievements unlocked yet' :
                       t === 'inprogress' ? 'No achievements in progress' :
                       t === 'locked' ? 'All locked achievements cleared!' :
                       'No achievements found'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t === 'unlocked' ? 'Complete lessons to start unlocking achievements!' :
                       t === 'inprogress' ? 'Start working on lessons to make progress.' :
                       'Keep up the great work!'}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {getTabList().map((ach) => {
                      const Icon = iconMap[ach.icon] || Award;
                      return (
                        <motion.div key={ach.id} variants={fadeInUp}>
                          <Card className={`h-full transition-all hover:shadow-lg ${
                            ach.isUnlocked
                              ? 'border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
                              : 'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${ach.gradient} flex items-center justify-center flex-shrink-0 shadow-md ${
                                  !ach.isUnlocked ? 'opacity-40 grayscale' : ''
                                }`}>
                                  {ach.isUnlocked
                                    ? <Icon className="w-7 h-7 text-white" />
                                    : <Lock className="w-7 h-7 text-white" />
                                  }
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className={`font-bold text-sm leading-tight ${
                                      ach.isUnlocked ? 'text-purple-900 dark:text-purple-100' : 'text-muted-foreground'
                                    }`}>
                                      {ach.name}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={`flex-shrink-0 text-xs px-1.5 py-0 ${
                                        ach.isUnlocked
                                          ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
                                          : 'border-gray-300 text-gray-400'
                                      }`}
                                    >
                                      <Coins className="w-3 h-3 mr-0.5" />
                                      {ach.coinReward}
                                    </Badge>
                                  </div>

                                  <p className="text-xs text-muted-foreground leading-snug mb-3">
                                    {ach.description}
                                  </p>

                                  {ach.isUnlocked ? (
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">Unlocked!</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span className="font-medium">{ach.progress}/{ach.requirement}</span>
                                      </div>
                                      <Progress value={ach.progressPercentage} className="h-1.5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Motivational footer */}
        {!loading && achievements.length > 0 && completionPct < 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-muted-foreground">
              <Zap className="w-4 h-4 inline mr-1 text-yellow-500" />
              Keep learning! You're{' '}
              <span className="font-semibold text-purple-600 dark:text-purple-400">{achievements.length - unlocked.length}</span>{' '}
              achievement{achievements.length - unlocked.length !== 1 ? 's' : ''} away from completing them all.
            </p>
          </motion.div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
};

export default AchievementsPage;
