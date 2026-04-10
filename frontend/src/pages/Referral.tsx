import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  BookOpen, 
  LogOut, 
  Copy, 
  Gift, 
  Users, 
  Star, 
  Trophy,
  Sparkles,
  CheckCircle2,
  Share2,
  Mail,
  MessageCircle,
  Menu,
  X,
  Lock,
  KeyRound,
  Bell,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStudentByUserId, signOut, changePassword } from "@/api";
import { getStudentReferralStats } from "@/api/referrals";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/api/notifications";

interface StudentInfo {
  fullName: string;
  grade: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
  rewards: string[];
}

const Referral = () => {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pointsEarned: 0,
    rewards: []
  });
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch student info
        const studentData = await getStudentByUserId(user.id);
        if (studentData) {
          setStudentInfo(studentData);
        }

        // Generate referral code (using user id as base)
        const code = `MINDSTA${user.id.substring(0, 8).toUpperCase()}`;
        setReferralCode(code);

        // Fetch real referral stats from backend
        try {
          const stats = await getStudentReferralStats(user.id);
          setReferralStats({
            totalReferrals: stats.totalReferrals,
            activeReferrals: stats.activeReferrals,
            pointsEarned: stats.totalReferrals * 30, // 30 points per referral
            rewards: stats.totalReferrals >= 5 ? ["Bronze", "5 Friends"] :
                     stats.totalReferrals >= 1 ? ["First Referral"] : []
          });
        } catch (_) {
          // Fallback to zero stats if fetch fails
          setReferralStats({ totalReferrals: 0, activeReferrals: 0, pointsEarned: 0, rewards: [] });
        }

        // Fetch notifications
        try {
          const notifData = await getNotifications();
          const notifList = Array.isArray(notifData) ? notifData : notifData?.notifications || [];
          setNotifications(notifList.slice(0, 10));
          setUnreadNotifications(notifList.filter((n: any) => !n.read && !n.isRead).length);
        } catch (_) {}

      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    try {
      signOut();
      refreshUser();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyReferralCode = () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied! 🎉",
      description: "Share this link with your friends!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = "Join me on Mindsta";
    const body = `Hi,\n\nI have been learning on Mindsta and I think you would love it too.\n\nUse my referral code: ${referralCode}\nOr sign up here: ${window.location.origin}/signup?ref=${referralCode}\n\nJoin me and let's learn together!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSocial = () => {
    const text = `Join me on Mindsta! Use my referral code: ${referralCode}`;
    const url = `${window.location.origin}/signup?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Join Mindsta",
        text: text,
        url: url
      });
    } else {
      toast({
        title: "Copy the link!",
        description: "Share it on your favorite social media!",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast({
        title: "Weak Password",
        description: "Password must contain uppercase, lowercase, and number",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(user.id, currentPassword, newPassword);
      
      toast({
        title: "Success! ",
        description: "Your password has been changed successfully",
      });

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const rewards = [
    { points: 50, name: "Bronze", description: "Refer 5 friends", unlocked: referralStats.totalReferrals >= 5 },
    { points: 100, name: "Silver", description: "Refer 10 friends", unlocked: referralStats.totalReferrals >= 10 },
    { points: 200, name: "Gold", description: "Refer 20 friends", unlocked: referralStats.totalReferrals >= 20 },
    { points: 500, name: "Champion", description: "Refer 50 friends", unlocked: referralStats.totalReferrals >= 50 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 bg-background/95 dark:bg-card backdrop-blur-sm shadow-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</h1>
                <span className="text-xs text-muted-foreground font-bold">Refer & Earn! </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="gap-2"
              >
                ← Back to Dashboard
              </Button>
              
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Your Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new secure password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          disabled={changingPassword}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowCurrentPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          disabled={changingPassword}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must contain uppercase, lowercase, and number
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          disabled={changingPassword}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPasswordDialogOpen(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={changingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      {changingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                    className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Button>
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-12 w-80 bg-card border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <h3 className="font-bold text-sm">Notifications 🔔</h3>
                        {unreadNotifications > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            onClick={async () => {
                              await markAllNotificationsAsRead();
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
                              setUnreadNotifications(0);
                            }}
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-muted-foreground text-sm">No notifications yet 🌟</div>
                        ) : notifications.map((n: any) => (
                          <div
                            key={n._id}
                            className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!n.isRead && !n.read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                            onClick={async () => {
                              if (!n.isRead && !n.read) {
                                await markNotificationAsRead(n._id);
                                setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true, read: true } : x));
                                setUnreadNotifications(c => Math.max(0, c - 1));
                              }
                            }}
                          >
                            <p className={`text-sm leading-snug ${!n.isRead && !n.read ? 'font-semibold' : ''}`}>{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(true)}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-purple-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-purple-600" />
              ) : (
                <Menu className="w-6 h-6 text-purple-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-4 animate-in slide-in-from-top-5 duration-200">
              <Button
                onClick={() => {
                  navigate("/dashboard");
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full gap-2 justify-center"
              >
                ← Back to Dashboard
              </Button>
              
              <Button
                onClick={() => {
                  setPasswordDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full gap-2 justify-center"
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowNotifications(!showNotifications);
                }}
                className="w-full gap-2 justify-center relative"
              >
                <Bell className="w-4 h-4" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowLogoutDialog(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 relative z-10 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
            <Gift className="w-4 h-4 mr-2 inline" />
            Referral Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Invite Friends, Earn Rewards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share Mindsta with your network and earn points for every successful referral.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
          <Card className="text-center hover:shadow-md transition-all duration-200 border-border">
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{referralStats.totalReferrals}</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-all duration-200 border-border">
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{referralStats.activeReferrals}</div>
              <div className="text-sm text-muted-foreground">Active Referrals</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-all duration-200 border-border">
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{referralStats.pointsEarned}</div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-all duration-200 border-border">
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{referralStats.rewards.length}</div>
              <div className="text-sm text-muted-foreground">Rewards Unlocked</div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Referral Link Card */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your Referral Link</CardTitle>
              <CardDescription>Share this link to invite friends to Mindsta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={`${window.location.origin}/signup?ref=${referralCode}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyReferralCode}
                  className="gap-2 shrink-0 bg-purple-600 hover:bg-purple-700"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button
                  onClick={shareViaSocial}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share
                </Button>
                <Button
                  onClick={copyReferralCode}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">How It Works</CardTitle>
              <CardDescription>Three simple steps to start earning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-5 bg-muted/30 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">1</div>
                  <h3 className="text-base font-semibold mb-2">Share Your Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Send your referral link to friends via email or social media.
                  </p>
                </div>
                <div className="text-center p-5 bg-muted/30 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">2</div>
                  <h3 className="text-base font-semibold mb-2">Friend Signs Up</h3>
                  <p className="text-sm text-muted-foreground">
                    When they join using your link, both of you earn rewards.
                  </p>
                </div>
                <div className="text-center p-5 bg-muted/30 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">3</div>
                  <h3 className="text-base font-semibold mb-2">Earn Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Collect points, unlock milestones, and grow your network.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards & Milestones */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Milestones</CardTitle>
              <CardDescription>Unlock rewards as you refer more friends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all flex items-center justify-between ${
                      reward.unlocked
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-muted/30 border-border opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        reward.unlocked ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                      }`}>
                        {reward.unlocked
                          ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                          : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{reward.name}</h3>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-1 shrink-0">
                      {reward.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What You Can Win */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">What You Can Win</CardTitle>
              <CardDescription>Prizes and perks for top referrers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                  <p className="text-sm font-medium">Exclusive badges &amp; certificates</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                  <p className="text-sm font-medium">Free premium features</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                  <p className="text-sm font-medium">Leaderboard recognition</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                  <p className="text-sm font-medium">Special rewards &amp; surprises</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500" />
              Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to sign out of your account? Any unsaved progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, sign me out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Referral;
