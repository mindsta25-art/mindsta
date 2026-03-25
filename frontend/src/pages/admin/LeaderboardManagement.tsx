import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Send,
  RefreshCw,
  MessageSquare,
  Users,
  Star,
  Zap,
  BookOpen,
  Flame,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Search,
  Filter,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { createNotification } from "@/api/notifications";
import AdminLayout from "@/components/AdminLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  userId: string;
  name: string;
  grade: string | number;
  coins: number;
  completedLessons: number;
  streak: number;
  rank: number;
  visible: boolean;
}

interface MessageDialogState {
  open: boolean;
  mode: "individual" | "broadcast";
  target?: LeaderboardEntry;
}

type Timeframe = "allTime" | "month" | "week";

// ─── Message Templates ────────────────────────────────────────────────────────

const getIndividualTemplates = (entry?: LeaderboardEntry) => [
  {
    label: "🏆 Congratulate #1",
    text: `Congratulations ${entry?.name || ""}! 🏆 You're currently ranked #${entry?.rank || 1} on the leaderboard with ${entry?.coins || 0} coins. Your hard work and dedication are truly inspiring — keep it up!`,
  },
  {
    label: "⭐ Great Progress",
    text: `Amazing work, ${entry?.name || ""}! ⭐ You've completed ${entry?.completedLessons || 0} lessons and maintained a ${entry?.streak || 0}-day streak. You're setting a fantastic example for everyone!`,
  },
  {
    label: "🔥 Keep the Streak",
    text: `Hey ${entry?.name || ""}! 🔥 Your ${entry?.streak || 0}-day learning streak is outstanding. Every day you learn, you're one step closer to mastering everything. Keep going!`,
  },
  {
    label: "🌟 Personal Message",
    text: `Hi ${entry?.name || ""}! We noticed your impressive performance on Mindsta. Keep pushing yourself and remember — every lesson brings you closer to your goals!`,
  },
];

const getBroadcastTemplates = () => [
  {
    label: "🚀 Challenge Everyone",
    text: "The competition is heating up on the Mindsta leaderboard! 🚀 Who will reach the top? Log in, complete lessons, and earn coins to climb the ranks. Your effort today shapes your future tomorrow!",
  },
  {
    label: "📚 Weekly Motivation",
    text: "Great week, Mindsta learners! 📚 The leaderboard is closer than you think — just a few more lessons could move you up several spots. Every coin counts, every lesson matters!",
  },
  {
    label: "🎯 Push for the Top",
    text: "Did you know the top students on Mindsta earn coins for every lesson and quiz? 🎯 Check the leaderboard and challenge yourself to climb higher. You have what it takes!",
  },
  {
    label: "🌟 Monthly Challenge",
    text: "A new month means a fresh start on the leaderboard! 🌟 Now is the perfect time to commit to daily learning and set a new personal best. Let's see who rises to the top!",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const PodiumCard = ({
  entry,
  position,
  onMessage,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  onMessage: (entry: LeaderboardEntry) => void;
}) => {
  const configs = {
    1: {
      icon: <Crown className="h-8 w-8" />,
      bg: "from-yellow-400 to-amber-500",
      ring: "ring-yellow-400",
      shadow: "shadow-yellow-200",
      label: "1st Place",
      height: "h-36",
      iconColor: "text-yellow-600",
      badge: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200",
    },
    2: {
      icon: <Medal className="h-7 w-7" />,
      bg: "from-gray-300 to-slate-400",
      ring: "ring-gray-300",
      shadow: "shadow-gray-200",
      label: "2nd Place",
      height: "h-28",
      iconColor: "text-muted-foreground",
      badge: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200",
    },
    3: {
      icon: <Medal className="h-7 w-7" />,
      bg: "from-orange-300 to-amber-400",
      ring: "ring-orange-300",
      shadow: "shadow-orange-100",
      label: "3rd Place",
      height: "h-24",
      iconColor: "text-orange-500",
      badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200",
    },
  };

  const c = configs[position];

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      {/* Avatar */}
      <div
        className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center ring-4 ${c.ring} shadow-lg ${c.shadow}`}
      >
        <span className="text-white font-bold text-xl">
          {entry.name.charAt(0).toUpperCase()}
        </span>
        <div
          className={`absolute -top-3 -right-1 ${c.iconColor} bg-white rounded-full p-0.5 shadow`}
        >
          {c.icon}
        </div>
      </div>

      {/* Name & Badge */}
      <div className="text-center">
        <p className="font-bold text-sm text-foreground leading-tight">
          {entry.name.split(" ")[0]}
        </p>
        {entry.grade !== "-" && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}
          >
            Grade {entry.grade}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="text-center space-y-1">
        <div className="flex items-center gap-1 justify-center">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-foreground">{entry.coins.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <span>{entry.completedLessons} lessons</span>
          <span>·</span>
          <span>{entry.streak}d streak</span>
        </div>
      </div>

      {/* Podium base */}
      <div
        className={`w-full ${c.height} bg-gradient-to-t ${c.bg} rounded-t-lg flex items-end justify-center pb-2 opacity-80`}
      >
        <span className="text-white font-black text-2xl">#{position}</span>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs gap-1"
        onClick={() => onMessage(entry)}
      >
        <MessageSquare className="h-3 w-3" />
        Message
      </Button>
    </div>
  );
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full font-black text-sm shadow">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-full font-black text-sm shadow">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-300 text-orange-900 rounded-full font-black text-sm shadow">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-semibold text-sm">
      {rank}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaderboardManagement() {
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("allTime");
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<
    "rank" | "coins" | "completedLessons" | "streak"
  >("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Message dialog
  const [msgDialog, setMsgDialog] = useState<MessageDialogState>({
    open: false,
    mode: "individual",
  });
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgType, setMsgType] = useState<"success" | "info" | "announcement">(
    "success"
  );
  const [msgPriority, setMsgPriority] = useState<"medium" | "high" | "urgent">(
    "medium"
  );
  const [sendingMsg, setSendingMsg] = useState(false);

  // ── Fetch leaderboard ──────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/gamification/admin/leaderboard", { timeframe });
      setLeaderboard((response as any)?.leaderboard || []);
    } catch (err) {
      console.error("Failed to fetch admin leaderboard:", err);
      toast({
        title: "Failed to load leaderboard",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [timeframe, toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ── Filtered & sorted list ─────────────────────────────────────────────────
  const displayed = leaderboard
    .filter((e) => {
      const matchesSearch = e.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGrade =
        gradeFilter === "all" || String(e.grade) === gradeFilter;
      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "rank") return (a.rank - b.rank) * dir;
      if (sortField === "coins") return (a.coins - b.coins) * dir;
      if (sortField === "completedLessons")
        return (a.completedLessons - b.completedLessons) * dir;
      if (sortField === "streak") return (a.streak - b.streak) * dir;
      return 0;
    });

  // Reset to page 1 whenever filters / sort / timeframe change
  useEffect(() => { setPage(1); }, [searchQuery, gradeFilter, sortField, sortDir, timeframe]);

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const paginatedDisplayed = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const top3 = leaderboard.slice(0, 3);
  const grades = Array.from(
    new Set(leaderboard.map((e) => String(e.grade)).filter((g) => g !== "-"))
  ).sort();

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalParticipants = leaderboard.length;
  const topCoins = leaderboard[0]?.coins || 0;
  const avgCoins =
    leaderboard.length > 0
      ? Math.round(
          leaderboard.reduce((s, e) => s + e.coins, 0) / leaderboard.length
        )
      : 0;
  const totalLessons = leaderboard.reduce(
    (s, e) => s + e.completedLessons,
    0
  );

  // ── Message dialog helpers ─────────────────────────────────────────────────
  const openIndividualMessage = (entry: LeaderboardEntry) => {
    const templates = getIndividualTemplates(entry);
    setMsgTitle(`Great work, ${entry.name}!`);
    setMsgBody(templates[0].text);
    setMsgType("success");
    setMsgPriority(entry.rank === 1 ? "high" : "medium");
    setMsgDialog({ open: true, mode: "individual", target: entry });
  };

  const openBroadcast = () => {
    const templates = getBroadcastTemplates();
    setMsgTitle("Keep climbing the leaderboard! 🚀");
    setMsgBody(templates[0].text);
    setMsgType("announcement");
    setMsgPriority("medium");
    setMsgDialog({ open: true, mode: "broadcast" });
  };

  const handleSendMessage = async () => {
    if (!msgTitle.trim() || !msgBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both title and message.",
        variant: "destructive",
      });
      return;
    }

    setSendingMsg(true);
    try {
      if (msgDialog.mode === "individual" && msgDialog.target) {
        await createNotification({
          title: msgTitle,
          message: msgBody,
          type: msgType,
          priority: msgPriority,
          targetAudience: "individual",
          targetUsers: [msgDialog.target.userId],
          targetGrades: [],
        });
        toast({
          title: "Message sent! 🎉",
          description: `${msgDialog.target.name} will see your message when they log in.`,
        });
      } else {
        // Broadcast to all students (all grades)
        await createNotification({
          title: msgTitle,
          message: msgBody,
          type: msgType,
          priority: msgPriority,
          targetAudience: "all",
          targetGrades: [],
        });
        toast({
          title: "Broadcast sent! 📢",
          description: "All students will see your motivational message.",
        });
      }
      setMsgDialog({ open: false, mode: "individual" });
    } catch (err) {
      console.error("Failed to send message:", err);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMsg(false);
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field)
      return <Minus className="h-3 w-3 text-muted-foreground/40 ml-1" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-blue-500 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 text-blue-500 ml-1" />
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-md">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Student Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalParticipants} students ranked · Encourage top performers &
              motivate everyone
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={openBroadcast}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
          >
            <Megaphone className="h-4 w-4" />
            Encourage All
          </Button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Users className="h-5 w-5 text-blue-500" />,
            label: "Total Students",
            value: totalParticipants.toString(),
            sub: "on leaderboard",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            icon: <Zap className="h-5 w-5 text-yellow-500" />,
            label: "Top Coins",
            value: topCoins.toLocaleString(),
            sub: leaderboard[0]?.name || "—",
            bg: "bg-yellow-50 dark:bg-yellow-950/30",
          },
          {
            icon: <Star className="h-5 w-5 text-purple-500" />,
            label: "Avg Coins",
            value: avgCoins.toLocaleString(),
            sub: "per student",
            bg: "bg-purple-50 dark:bg-purple-950/30",
          },
          {
            icon: <BookOpen className="h-5 w-5 text-green-500" />,
            label: "Total Lessons",
            value: totalLessons.toLocaleString(),
            sub: "completed overall",
            bg: "bg-green-50 dark:bg-green-950/30",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
              <div className="text-xs font-medium text-muted-foreground mt-1">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Timeframe filter ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        <Tabs
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as Timeframe)}
        >
          <TabsList className="bg-muted">
            <TabsTrigger value="allTime">All Time</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Podium (top 3) ── */}
      {!loading && top3.length >= 3 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              This period's leading students — send them a personal
              congratulations!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-4 bg-gradient-to-b from-amber-50/30 dark:from-amber-950/10 to-white dark:to-background">
            <div className="flex items-end justify-center gap-4 max-w-xl mx-auto">
              {/* 2nd place */}
              {top3[1] && (
                <PodiumCard
                  entry={top3[1]}
                  position={2}
                  onMessage={openIndividualMessage}
                />
              )}
              {/* 1st place (taller) */}
              {top3[0] && (
                <PodiumCard
                  entry={top3[0]}
                  position={1}
                  onMessage={openIndividualMessage}
                />
              )}
              {/* 3rd place */}
              {top3[2] && (
                <PodiumCard
                  entry={top3[2]}
                  position={3}
                  onMessage={openIndividualMessage}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Full table ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Full Rankings
              <Badge variant="secondary" className="font-normal ml-1">
                {displayed.length} students
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-8 h-8 text-sm w-44"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Grade filter */}
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="h-8 w-28 text-sm">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>
                        Grade {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading leaderboard...</span>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <Trophy className="h-12 w-12 opacity-20" />
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[56px_1fr_80px_120px_120px_100px_100px] gap-2 px-4 py-2 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <button
                  className="flex items-center"
                  onClick={() => toggleSort("rank")}
                >
                  Rank <SortIcon field="rank" />
                </button>
                <span>Student</span>
                <span>Grade</span>
                <button
                  className="flex items-center"
                  onClick={() => toggleSort("coins")}
                >
                  Coins <SortIcon field="coins" />
                </button>
                <button
                  className="flex items-center"
                  onClick={() => toggleSort("completedLessons")}
                >
                  Lessons <SortIcon field="completedLessons" />
                </button>
                <button
                  className="flex items-center"
                  onClick={() => toggleSort("streak")}
                >
                  Streak <SortIcon field="streak" />
                </button>
                <span className="text-right">Action</span>
              </div>

              {/* Rows */}
              {paginatedDisplayed.map((entry, idx) => (
                <div key={entry.userId}>
                  <div
                    className={`grid grid-cols-[56px_1fr_80px_120px_120px_100px_100px] gap-2 px-4 py-3 items-center transition-colors hover:bg-muted/30 ${
                      entry.rank <= 3 ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex justify-center">
                      <RankBadge rank={entry.rank} />
                    </div>

                    {/* Student */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                          entry.rank === 1
                            ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                            : entry.rank === 2
                            ? "bg-gradient-to-br from-gray-300 to-slate-400"
                            : entry.rank === 3
                            ? "bg-gradient-to-br from-orange-300 to-amber-400"
                            : "bg-gradient-to-br from-blue-400 to-indigo-500"
                        }`}
                      >
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {entry.name}
                        </p>
                        {!entry.visible && (
                          <span className="text-xs text-muted-foreground">
                            Hidden from public
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Grade */}
                    <div>
                      {entry.grade !== "-" ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          Gr. {entry.grade}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>

                    {/* Coins */}
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      <span className="font-bold text-foreground text-sm">
                        {entry.coins.toLocaleString()}
                      </span>
                    </div>

                    {/* Lessons */}
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground/80">
                        {entry.completedLessons}
                      </span>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-1.5">
                      <Flame
                        className={`h-4 w-4 flex-shrink-0 ${
                          entry.streak > 0
                            ? "text-orange-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                      <span className="text-sm text-foreground/80">
                        {entry.streak}d
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        onClick={() => openIndividualMessage(entry)}
                      >
                        <Send className="h-3 w-3" />
                        Message
                      </Button>
                    </div>
                  </div>
                  {idx < paginatedDisplayed.length - 1 && (
                    <Separator className="mx-4 opacity-50" />
                  )}
                </div>
              ))}

              {/* Pagination */}
              {displayed.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayed.length)} of {displayed.length} students
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="gap-1 h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <span className="text-sm font-medium px-1 tabular-nums">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="gap-1 h-8"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Message / Broadcast Dialog ── */}
      <Dialog
        open={msgDialog.open}
        onOpenChange={(o) => setMsgDialog((prev) => ({ ...prev, open: o }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {msgDialog.mode === "broadcast" ? (
                <>
                  <Megaphone className="h-5 w-5 text-blue-500" />
                  Encourage All Students
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Message to {msgDialog.target?.name}
                  {msgDialog.target && (
                    <Badge className="ml-1 font-normal" variant="secondary">
                      #{msgDialog.target.rank}
                    </Badge>
                  )}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {msgDialog.mode === "broadcast"
                ? "Send an encouraging notification to every student on Mindsta."
                : `Send a personal notification directly to ${msgDialog.target?.name}'s inbox.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Templates */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Quick Templates
              </Label>
              <div className="flex flex-wrap gap-2">
                {(msgDialog.mode === "individual"
                  ? getIndividualTemplates(msgDialog.target)
                  : getBroadcastTemplates()
                ).map((t) => (
                  <button
                    key={t.label}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-muted-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                    onClick={() => {
                      setMsgBody(t.text);
                      if (msgDialog.mode === "individual" && msgDialog.target) {
                        setMsgTitle(`Great work, ${msgDialog.target.name}!`);
                      }
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="msg-title">Notification Title</Label>
              <Input
                id="msg-title"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                placeholder="Enter a catchy title..."
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor="msg-body">Message</Label>
              <Textarea
                id="msg-body"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Write your encouraging message..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {msgBody.length} characters
              </p>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={msgType}
                  onValueChange={(v) =>
                    setMsgType(
                      v as "success" | "info" | "announcement"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">🎉 Success</SelectItem>
                    <SelectItem value="announcement">📢 Announcement</SelectItem>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={msgPriority}
                  onValueChange={(v) =>
                    setMsgPriority(v as "medium" | "high" | "urgent")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setMsgDialog((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMsg || !msgTitle.trim() || !msgBody.trim()}
              className={
                msgDialog.mode === "broadcast"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2"
              }
            >
              {sendingMsg ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : msgDialog.mode === "broadcast" ? (
                <Megaphone className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendingMsg
                ? "Sending..."
                : msgDialog.mode === "broadcast"
                ? "Send to All Students"
                : `Send to ${msgDialog.target?.name?.split(" ")[0] || "Student"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
