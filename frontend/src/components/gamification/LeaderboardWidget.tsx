import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Crown, TrendingUp, Eye, EyeOff, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface LeaderboardEntry {
  userId: string;
  name: string;
  coins: number;
  completedLessons: number;
  streak: number;
  rank: number;
  isCurrentUser: boolean;
}

interface LeaderboardWidgetProps {
  leaderboard: LeaderboardEntry[];
  userPosition: LeaderboardEntry | undefined;
  totalParticipants: number;
  isVisible: boolean;
  showFullName: boolean;
  onUpdateSettings: (visible: boolean, showFullName: boolean) => void;
  onChangeTimeframe: (timeframe: string) => void;
  onChangeScope: (scope: string) => void;
}

export const LeaderboardWidget = ({
  leaderboard,
  userPosition,
  totalParticipants,
  isVisible,
  showFullName,
  onUpdateSettings,
  onChangeTimeframe,
  onChangeScope,
}: LeaderboardWidgetProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localVisible, setLocalVisible] = useState(isVisible);
  const [localShowFullName, setLocalShowFullName] = useState(showFullName);
  const [activeTimeframe, setActiveTimeframe] = useState('allTime');
  const [loadingTimeframe, setLoadingTimeframe] = useState(false);
  const navigate = useNavigate();

  const handleTimeframeChange = async (timeframe: string) => {
    setActiveTimeframe(timeframe);
    setLoadingTimeframe(true);
    try {
      await onChangeTimeframe(timeframe);
    } finally {
      setLoadingTimeframe(false);
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localVisible, localShowFullName);
    setSettingsOpen(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-red-500';
    return 'from-blue-400 to-indigo-500';
  };

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Leaderboard
          </CardTitle>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leaderboard Settings</DialogTitle>
                <DialogDescription>
                  Control your visibility on the leaderboard
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label>Show me on leaderboard</Label>
                  <Switch checked={localVisible} onCheckedChange={setLocalVisible} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show full name</Label>
                  <Switch checked={localShowFullName} onCheckedChange={setLocalShowFullName} disabled={!localVisible} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTimeframe} onValueChange={handleTimeframeChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="allTime">All Time</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>

          {/* Single shared content — same data, driven by activeTimeframe */}
          <div className="space-y-3">
            {loadingTimeframe ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* User Position */}
                {userPosition && (
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border-2 border-indigo-300 dark:border-indigo-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {userPosition.rank}
                        </div>
                        <div>
                          <p className="font-semibold">Your Rank</p>
                          <p className="text-xs text-muted-foreground">
                            {userPosition.coins} coins • {userPosition.completedLessons} lessons
                          </p>
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                )}

                {/* Rankings list */}
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No data for this period yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leaderboard.slice(0, 20).map((entry, idx) => (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg ${
                          entry.isCurrentUser
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500'
                            : 'bg-gray-50 dark:bg-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getRankColor(entry.rank)} rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
                            {getRankIcon(entry.rank) || entry.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{entry.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{entry.coins} coins</span>
                              <span>•</span>
                              <span>{entry.completedLessons} lessons</span>
                              {entry.streak > 0 && (
                                <>
                                  <span>•</span>
                                  <span>🔥 {entry.streak}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {entry.isCurrentUser && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Stats Footer */}
                <div className="pt-3 border-t text-center text-xs text-muted-foreground">
                  <Users className="w-4 h-4 inline mr-1" />
                  {totalParticipants} students competing
                </div>

                {/* View All Button */}
                <Button
                  variant="outline"
                  className="w-full mt-2 gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950/30 font-semibold"
                  onClick={() => navigate('/leaderboard')}
                >
                  <Trophy className="w-4 h-4" />
                  View Full Leaderboard
                </Button>
              </>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
