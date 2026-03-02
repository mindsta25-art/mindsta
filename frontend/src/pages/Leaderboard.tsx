import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Star,
} from 'lucide-react';
import { getStudentByUserId } from '@/api/students';
import { getLeaderboard } from '@/api/gamification';
import { getPublicAdvancedSettings } from '@/api/settings';

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
type Scope = 'global' | 'school';

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  allTime: 'All Time',
  month: 'This Month',
  week: 'This Week',
};

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
      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

  const avatarBg =
    entry.rank === 1
      ? 'from-yellow-400 to-amber-500'
      : entry.rank === 2
      ? 'from-gray-300 to-slate-400'
      : entry.rank === 3
      ? 'from-orange-300 to-amber-400'
      : 'from-indigo-400 to-purple-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        entry.isCurrentUser
          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-700'
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
            <Badge variant="outline" className="text-xs border-indigo-400 text-indigo-600 dark:text-indigo-400">
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
              {entry.streak}d
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
  const [scope, setScope] = useState<Scope>('global');
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch student name
  useEffect(() => {
    if (!user) return;
    getStudentByUserId(user.id)
      .then((s) => setStudentName(s?.fullName || ''))
      .catch(() => {});
  }, [user]);

  // Fetch leaderboard per page setting
  useEffect(() => {
    getPublicAdvancedSettings()
      .then((s) => setItemsPerPage(s.leaderboardPerPage ?? 10))
      .catch(() => {});
  }, []);

  // Fetch leaderboard
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(timeframe, scope);
      setLeaderboard(data?.leaderboard || []);
      setUserPosition(data?.userPosition);
      setTotalParticipants(data?.totalParticipants || 0);
    } catch {
      toast({ title: 'Failed to load leaderboard', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [timeframe, scope, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Reset to page 1 whenever filters or search change
  useEffect(() => { setCurrentPage(1); }, [timeframe, scope, search]);

  // Paginated slice of rest (after top 3)
  const totalRestPages = Math.ceil(rest.length / itemsPerPage);
  const pagedRest = rest.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // When a search is active, filter the full list but always keep the podium visible
  const filteredList = search.trim()
    ? leaderboard.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : null; // null = show full ranked list (no active search)

  const topCoins = leaderboard[0]?.coins || 0;
  const avgCoins =
    leaderboard.length > 0
      ? Math.round(
          leaderboard.reduce((s, e) => s + e.coins, 0) / leaderboard.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <StudentHeader studentName={studentName} />

      <main className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl shadow-lg mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalParticipants} students competing · See where you stand!
          </p>
        </motion.div>

        {/* ── Stats mini bar ── */}
        {!loading && leaderboard.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                icon: <Users className="h-4 w-4 text-blue-500" />,
                label: 'Students',
                value: totalParticipants,
                bg: 'bg-blue-50 dark:bg-blue-950/30',
              },
              {
                icon: <Zap className="h-4 w-4 text-yellow-500" />,
                label: 'Top Coins',
                value: topCoins.toLocaleString(),
                bg: 'bg-yellow-50 dark:bg-yellow-950/30',
              },
              {
                icon: <Star className="h-4 w-4 text-purple-500" />,
                label: 'Avg Coins',
                value: avgCoins.toLocaleString(),
                bg: 'bg-purple-50 dark:bg-purple-950/30',
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

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Timeframe */}
          <Tabs
            value={timeframe}
            onValueChange={(v) => setTimeframe(v as Timeframe)}
            className="flex-1"
          >
            <TabsList className="w-full bg-white dark:bg-gray-800 shadow-sm border">
              {(['allTime', 'month', 'week'] as Timeframe[]).map((t) => (
                <TabsTrigger key={t} value={t} className="flex-1 text-xs sm:text-sm">
                  {TIMEFRAME_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Scope */}
          <div className="flex gap-2">
            {(['global', 'school'] as Scope[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={scope === s ? 'default' : 'outline'}
                className={scope === s ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                onClick={() => setScope(s)}
              >
                {s === 'global' ? '🌍 Global' : '🏫 My School'}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search a student by name…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ── My Rank Banner (if outside top 3) ── */}
        {!loading && userPosition && userPosition.rank > 3 && !search && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                  {userPosition.rank}
                </div>
                <div>
                  <p className="font-bold text-sm">Your Current Rank</p>
                  <p className="text-xs text-white/80">
                    {userPosition.coins.toLocaleString()} coins · {userPosition.completedLessons} lessons
                  </p>
                </div>
              </div>
              <TrendingUp className="h-6 w-6 text-white/70" />
            </div>
          </motion.div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="h-14 w-14 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No students yet</p>
            <p className="text-sm mt-1">Be the first to earn coins!</p>
          </div>
        ) : (
          <>
            {/* ── Podium — always visible, even during search ── */}
            {top3.length === 3 && (
              <Card className="border-0 shadow-sm mb-6 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Top 3 Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/10 dark:to-transparent pt-6 pb-4">
                  <div className="flex items-end justify-center gap-3 max-w-sm mx-auto">
                    <PodiumEntry entry={top3[1]} position={2} />
                    <PodiumEntry entry={top3[0]} position={1} />
                    <PodiumEntry entry={top3[2]} position={3} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Search results or full ranked list ── */}
            {filteredList ? (
              /* ── Search results ── */
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {filteredList.length} result{filteredList.length !== 1 ? 's' : ''} for "{search}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  {filteredList.length === 0 ? (
                    <p className="text-center py-10 text-sm text-muted-foreground">
                      No student found with that name
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredList.map((entry, idx) => (
                        <LeaderboardRow key={entry.userId} entry={entry} index={idx} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* ── Full rankings ── */
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    All Rankings
                    <Badge variant="secondary" className="font-normal ml-1">
                      {leaderboard.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  {/* Top 3 rows */}
                  <div className="space-y-1 mb-1">
                    {top3.map((entry, idx) => (
                      <LeaderboardRow key={entry.userId} entry={entry} index={idx} />
                    ))}
                  </div>
                  {rest.length > 0 && (
                    <>
                      <div className="my-2 border-t" />
                      <div className="space-y-1">
                        {pagedRest.map((entry, idx) => (
                          <LeaderboardRow key={entry.userId} entry={entry} index={(currentPage - 1) * itemsPerPage + idx + 3} />
                        ))}
                      </div>
                      {totalRestPages > 1 && (
                        <div className="flex items-center justify-between pt-3 px-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalRestPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setCurrentPage((p) => Math.min(totalRestPages, p + 1))}
                            disabled={currentPage === totalRestPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <StudentFooter />
    </div>
  );
};

export default LeaderboardPage;
