import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Crown,
  Medal,
  Zap,
  BookOpen,
  Flame,
  Target,
  Users,
  TrendingUp,
  Star,
  Rocket,
  ArrowUp,
} from 'lucide-react';
import { getStudentByUserId } from '@/api/students';
import { getLeaderboard } from '@/api/gamification';

interface LeaderboardEntry {
  userId: string;
  name: string;
  coins: number;
  completedLessons: number;
  streak: number;
  rank: number;
  isCurrentUser: boolean;
}

type Timeframe = 'allTime' | 'month' | 'week';

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  allTime: 'All Time',
  month: 'This Month',
  week: 'This Week',
};

const TOP_N = 10;

// ─── Podium Card ─────────────────────────────────────────────────────────────

const PodiumEntry = ({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}) => {
  const cfg = {
    1: {
      icon: <Crown className="h-7 w-7 text-yellow-600" />,
      ring: 'ring-yellow-400',
      bg: 'from-yellow-400 to-amber-500',
      base: 'h-32',
      baseBg: 'from-yellow-400 to-amber-500',
      label: 'bg-yellow-100 text-yellow-800',
    },
    2: {
      icon: <Medal className="h-6 w-6 text-gray-500" />,
      ring: 'ring-gray-300',
      bg: 'from-gray-300 to-slate-400',
      base: 'h-24',
      baseBg: 'from-gray-300 to-slate-400',
      label: 'bg-gray-100 text-gray-700',
    },
    3: {
      icon: <Medal className="h-6 w-6 text-orange-500" />,
      ring: 'ring-orange-300',
      bg: 'from-orange-300 to-amber-400',
      base: 'h-20',
      baseBg: 'from-orange-300 to-amber-400',
      label: 'bg-orange-100 text-orange-800',
    },
  }[position];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className="flex flex-col items-center gap-2 flex-1"
    >
      {/* Avatar */}
      <div
        className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${cfg.bg} ring-4 ${cfg.ring} flex items-center justify-center shadow-lg`}
      >
        <span className="text-white font-black text-xl">
          {entry.name.charAt(0).toUpperCase()}
        </span>
        <div className="absolute -top-3 -right-1 bg-white rounded-full p-0.5 shadow">
          {cfg.icon}
        </div>
      </div>

      {/* Name */}
      <p className="font-bold text-sm text-center text-gray-900 dark:text-white leading-tight line-clamp-1 w-full text-center px-1">
        {entry.name}
      </p>

      {/* Coins */}
      <div className="flex items-center gap-1">
        <Zap className="h-3.5 w-3.5 text-yellow-500" />
        <span className="font-bold text-sm">{entry.coins.toLocaleString()}</span>
      </div>

      {/* Lessons */}
      <span className="text-xs text-muted-foreground">
        {entry.completedLessons} lessons
      </span>

      {entry.isCurrentUser && (
        <Badge className="text-xs bg-indigo-600 text-white border-0 px-2 py-0">
          You
        </Badge>
      )}

      {/* Podium base */}
      <div
        className={`w-full ${cfg.base} bg-gradient-to-t ${cfg.baseBg} rounded-t-xl flex items-end justify-center pb-2 opacity-80`}
      >
        <span className="text-white font-black text-3xl drop-shadow">
          #{position}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Row ──────────────────────────────────────────────────────────────────────

const LeaderboardRow = ({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) => {
  const rankBg =
    entry.rank === 1
      ? 'bg-yellow-400 text-yellow-900'
      : entry.rank === 2
      ? 'bg-gray-300 text-gray-800'
      : entry.rank === 3
      ? 'bg-orange-300 text-orange-900'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';

  const avatarBg =
    entry.rank === 1
      ? 'from-yellow-400 to-amber-500'
      : entry.rank === 2
      ? 'from-gray-300 to-slate-400'
      : entry.rank === 3
      ? 'from-orange-300 to-amber-400'
      : 'from-purple-500 to-pink-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.6) }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        entry.isCurrentUser
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-2 border-purple-300 dark:border-purple-700 shadow-sm'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
      }`}
    >
      {/* Rank badge */}
      <span
        className={`inline-flex w-9 h-9 rounded-full items-center justify-center font-black text-sm flex-shrink-0 ${rankBg}`}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
      >
        {entry.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + you */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{entry.name}</span>
          {entry.isCurrentUser && (
            <Badge className="text-xs bg-purple-600 text-white border-0 px-2 py-0">
              You
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-0.5">
            <Zap className="h-3 w-3 text-yellow-500" />
            {entry.coins.toLocaleString()} coins
          </span>
          <span className="flex items-center gap-0.5">
            <BookOpen className="h-3 w-3 text-green-500" />
            {entry.completedLessons} lessons
          </span>
          {entry.streak > 0 && (
            <span className="flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-orange-500" />
              {entry.streak}d streak
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const LeaderboardSkeleton = () => (
  <div className="space-y-2 p-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-16 rounded-xl" />
    ))}
  </div>
);

// ─── Not-on-the-list encouragement banner ─────────────────────────────────────

const NotOnListBanner = ({ userPosition }: { userPosition: LeaderboardEntry }) => {
  const encouragements = [
    { msg: 'Keep going! Every lesson gets you closer to the Top 10!', icon: <Rocket className="h-5 w-5" /> },
    { msg: 'Champions are made one lesson at a time. You can do this!', icon: <Target className="h-5 w-5" /> },
    { msg: 'The top 10 is within reach — complete more lessons and earn coins!', icon: <ArrowUp className="h-5 w-5" /> },
  ];
  const tip = encouragements[userPosition.rank % encouragements.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-2xl overflow-hidden shadow-md"
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-b-2xl p-5">
        <div className="flex items-start gap-4">
          {/* rank badge */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/30 flex flex-col items-center justify-center border border-purple-200 dark:border-purple-800">
            <span className="text-xs text-purple-500 font-semibold leading-none">Rank</span>
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300 leading-tight">
              #{userPosition.rank}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-gray-900 dark:text-white">You're not in the Top 10 yet</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{tip.msg}</p>
            {/* progress stats */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                <Zap className="h-3 w-3" />
                {userPosition.coins.toLocaleString()} coins
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                <BookOpen className="h-3 w-3" />
                {userPosition.completedLessons} lessons done
              </span>
              {userPosition.streak > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                  <Flame className="h-3 w-3" />
                  {userPosition.streak}d streak
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-purple-400 dark:text-purple-500 mt-0.5">{tip.icon}</div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Complete more lessons and quizzes daily to earn coins and climb the ranks!
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | undefined>();
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('allTime');

  // Fetch student name
  useEffect(() => {
    if (!user) return;
    getStudentByUserId(user.id)
      .then((s) => setStudentName(s?.fullName || ''))
      .catch(() => {});
  }, [user]);

  // Fetch leaderboard
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(timeframe, 'global');
      // Only keep the top 10
      const top10 = (data?.leaderboard || []).slice(0, TOP_N);
      setLeaderboard(top10);
      setUserPosition(data?.userPosition);
      setTotalParticipants(data?.totalParticipants || 0);
    } catch {
      toast({ title: 'Failed to load leaderboard', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [timeframe, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const top3 = leaderboard.slice(0, 3);
  const rest4to10 = leaderboard.slice(3);

  const isUserInTop10 = userPosition ? userPosition.rank <= TOP_N : false;

  const topCoins = leaderboard[0]?.coins || 0;
  const avgCoins =
    leaderboard.length > 0
      ? Math.round(
          leaderboard.reduce((s, e) => s + e.coins, 0) / leaderboard.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <StudentHeader studentName={studentName} />

      <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        {/* ── Hero heading ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Top 10 Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalParticipants.toLocaleString()} students competing · Only the best make the list!
          </p>
        </motion.div>

        {/* ── Stats mini bar ── */}
        {!loading && leaderboard.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                icon: <Users className="h-4 w-4 text-purple-500" />,
                label: 'Competing',
                value: totalParticipants.toLocaleString(),
                bg: 'bg-purple-50 dark:bg-purple-950/30',
              },
              {
                icon: <Zap className="h-4 w-4 text-yellow-500" />,
                label: 'Top Coins',
                value: topCoins.toLocaleString(),
                bg: 'bg-yellow-50 dark:bg-yellow-950/30',
              },
              {
                icon: <Star className="h-4 w-4 text-pink-500" />,
                label: 'Avg Coins',
                value: avgCoins.toLocaleString(),
                bg: 'bg-pink-50 dark:bg-pink-950/30',
              },
            ].map((s) => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-3 flex flex-col items-center gap-1">
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                  <span className="font-bold text-base">{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Timeframe filter ── */}
        <Tabs
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as Timeframe)}
          className="mb-6"
        >
          <TabsList className="w-full bg-white dark:bg-gray-800 shadow-sm border">
            {(['allTime', 'month', 'week'] as Timeframe[]).map((t) => (
              <TabsTrigger key={t} value={t} className="flex-1 text-xs sm:text-sm">
                {TIMEFRAME_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ── Content ── */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="h-14 w-14 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No students yet</p>
            <p className="text-sm mt-1">Be the first to earn coins and top this chart!</p>
          </div>
        ) : (
          <>
            {/* ── Podium for top 3 ── */}
            {top3.length === 3 && (
              <Card className="border-0 shadow-md mb-5 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Hall of Fame — Top 3
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-gradient-to-b from-pink-50/40 to-white dark:from-pink-950/10 dark:to-transparent pt-6 pb-4">
                  <div className="flex items-end justify-center gap-3 max-w-sm mx-auto">
                    <PodiumEntry entry={top3[1]} position={2} />
                    <PodiumEntry entry={top3[0]} position={1} />
                    <PodiumEntry entry={top3[2]} position={3} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Ranks 4-10 ── */}
            {rest4to10.length > 0 && (
              <Card className="border-0 shadow-sm mb-5">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    Ranks 4 – 10
                    <Badge className="font-normal ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0">
                      {rest4to10.length} students
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {rest4to10.map((entry, idx) => (
                      <LeaderboardRow key={entry.userId} entry={entry} index={idx + 3} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Not on the list banner ── */}
            {userPosition && !isUserInTop10 && (
              <NotOnListBanner userPosition={userPosition} />
            )}

            {/* ── User IS in top 10 — congratulate ── */}
            {userPosition && isUserInTop10 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg text-center"
              >
                <Trophy className="h-6 w-6 mx-auto mb-1" />
                <p className="font-bold text-sm">🎉 You're in the Top 10!</p>
                <p className="text-xs text-white/80 mt-0.5">
                  Amazing work! Keep earning coins to hold your spot.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>

      <StudentFooter />
    </div>
  );
};

export default LeaderboardPage;
