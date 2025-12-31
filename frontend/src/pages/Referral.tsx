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
  KeyRound
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStudentByUserId, signOut, changePassword } from "@/api";

interface StudentInfo {
  fullName: string;
  grade: string;
  schoolName: string;
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
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pointsEarned: 0,
    rewards: []
  });
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
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

        // Mock referral stats (in production, fetch from database)
        setReferralStats({
          totalReferrals: 5,
          activeReferrals: 3,
          pointsEarned: 150,
          rewards: ["🎖️ Bronze Referrer", "⭐ 5 Friends Club"]
        });
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
      navigate("/");
      toast({
        title: "See you later! ",
        description: "Come back soon for more fun learning!",
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
    const referralLink = `https://mindsta.com/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied! 🎉",
      description: "Share this link with your friends!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = "Join me on Mindsta! 🎓";
    const body = `Hey! I've been learning on Mindsta and it's super fun! \n\nUse my referral code: ${referralCode}\nOr click here: https://mindsta.com/signup?ref=${referralCode}\n\nLet's learn together! 🌟`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSocial = () => {
    const text = `Join me on Mindsta! Use my code: ${referralCode} `;
    const url = `https://mindsta.com/signup?ref=${referralCode}`;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-4xl animate-bounce">🎁</div>
      </div>
    );
  }

  const rewards = [
    { points: 50, name: "Bronze Referrer 🥉", description: "Refer 5 friends", unlocked: referralStats.totalReferrals >= 5 },
    { points: 100, name: "Silver Referrer 🥈", description: "Refer 10 friends", unlocked: referralStats.totalReferrals >= 10 },
    { points: 200, name: "Gold Referrer 🥇", description: "Refer 20 friends", unlocked: referralStats.totalReferrals >= 20 },
    { points: 500, name: "Super Star ⭐", description: "Refer 50 friends", unlocked: referralStats.totalReferrals >= 50 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-muted dark:to-background relative overflow-hidden">
      {/* Fun Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl animate-bounce delay-200">🎁</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce delay-500">⭐</div>
        <div className="absolute bottom-20 left-20 text-4xl animate-bounce delay-700">🎉</div>
        <div className="absolute bottom-32 right-32 text-4xl animate-bounce delay-1000">🏆</div>
      </div>

      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-card backdrop-blur-sm shadow-lg border-b-4 border-purple-300 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-pulse">
                <BookOpen className="w-6 h-6 text-white" />
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
                className="gap-2 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold"
              >
                ← Back to Dashboard
              </Button>
              
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2 border-2 border-green-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold"
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
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        disabled={changingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        disabled={changingPassword}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must contain uppercase, lowercase, and number
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        disabled={changingPassword}
                      />
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

              <Button
                onClick={handleLogout}
                className="gap-2 border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold"
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
                className="w-full gap-2 border-2 border-blue-300 hover:border-blue-500 font-bold justify-center"
              >
                ← Back to Dashboard
              </Button>
              
              <Button
                onClick={() => {
                  setPasswordDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 border-2 border-green-300 hover:border-green-500 font-bold justify-center"
              >
                <KeyRound className="w-4 h-4" />
                Change Password 
              </Button>
              
              <Button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 border-2 border-purple-300 hover:border-purple-500 font-bold justify-center"
              >
                <LogOut className="w-4 h-4" />
                Logout 
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* <div className="text-7xl mb-4 animate-bounce">🎁</div> */}
          <Badge className="mb-4 px-6 py-3 text-base font-bold bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border-yellow-500/50">
            <Gift className="w-5 h-5 mr-2 inline animate-pulse" />
            Refer Friends & Earn Rewards! 
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black text-foreground mb-4">
            Share the Fun! 🎉
          </h1>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 max-w-2xl mx-auto">
            Invite your friends and earn awesome rewards together! 🚀
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-6xl mx-auto">
          <Card className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 border-4 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-white to-blue-50">
            <CardContent className="p-6">
              <Users className="w-12 h-12 mx-auto mb-2 text-blue-600" />
              <div className="text-4xl font-black text-blue-600 mb-2">{referralStats.totalReferrals}</div>
              <div className="text-sm font-bold text-foreground">Total Referrals 👥</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 border-4 border-green-200 hover:border-green-400 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <div className="text-4xl font-black text-green-600 mb-2">{referralStats.activeReferrals}</div>
              <div className="text-sm font-bold text-foreground">Active Friends ✅</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 border-4 border-yellow-200 hover:border-yellow-400 bg-gradient-to-br from-white to-yellow-50">
            <CardContent className="p-6">
              <Star className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
              <div className="text-4xl font-black text-yellow-600 mb-2">{referralStats.pointsEarned}</div>
              <div className="text-sm font-bold text-foreground">Points Earned ⭐</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 border-4 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-6">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-purple-600" />
              <div className="text-4xl font-black text-purple-600 mb-2">{referralStats.rewards.length}</div>
              <div className="text-sm font-bold text-foreground">Rewards Unlocked 🏆</div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Referral Code Card */}
          <Card className="border-4 border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4 animate-bounce">💝</div>
              <CardTitle className="text-3xl font-black">Your Special Referral Code!</CardTitle>
              <CardDescription className="text-lg font-bold">Share this code with your friends!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  value={`https://mindsta.com/signup?ref=${referralCode}`}
                  readOnly
                  className="text-center text-lg font-bold border-4 border-purple-300"
                />
                <Button
                  onClick={copyReferralCode}
                  className="gap-2 font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copied! 🎉" : "Copy"}
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="gap-2 border-2 border-blue-300 hover:border-blue-500 font-bold"
                >
                  <Mail className="w-5 h-5" />
                  Share via Email 📧
                </Button>
                <Button
                  onClick={shareViaSocial}
                  variant="outline"
                  className="gap-2 border-2 border-green-300 hover:border-green-500 font-bold"
                >
                  <MessageCircle className="w-5 h-5" />
                  Share on Social 💬
                </Button>
                <Button
                  onClick={copyReferralCode}
                  variant="outline"
                  className="gap-2 border-2 border-purple-300 hover:border-purple-500 font-bold"
                >
                  <Share2 className="w-5 h-5" />
                  Copy Link 🔗
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border-4 border-blue-300 shadow-xl">
            <CardHeader>
              <div className="text-5xl mb-2 text-center">📚</div>
              <CardTitle className="text-3xl font-black text-center">How It Works</CardTitle>
              <CardDescription className="text-center font-bold">Super easy! Just 3 steps!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
                  <div className="text-5xl mb-4">1️⃣</div>
                  <h3 className="text-xl font-black mb-2">Share Your Code</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    Send your referral link to friends via email or social media!
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                  <div className="text-5xl mb-4">2️⃣</div>
                  <h3 className="text-xl font-black mb-2">Friend Joins</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    When they sign up using your code, you both get rewards!
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
                  <div className="text-5xl mb-4">3️⃣</div>
                  <h3 className="text-xl font-black mb-2">Earn Together!</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    Collect points, unlock badges, and win awesome prizes!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards & Milestones */}
          <Card className="border-4 border-yellow-300 shadow-xl">
            <CardHeader>
              <div className="text-5xl mb-2 text-center">🏆</div>
              <CardTitle className="text-3xl font-black text-center">Rewards & Milestones</CardTitle>
              <CardDescription className="text-center font-bold">Unlock amazing badges as you refer more friends!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-4 transition-all ${
                      reward.unlocked
                        ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400"
                        : "bg-gray-50 border-gray-300 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{reward.unlocked ? "✅" : "🔒"}</div>
                        <div>
                          <h3 className="text-xl font-black">{reward.name}</h3>
                          <p className="text-sm font-medium text-muted-foreground">{reward.description}</p>
                        </div>
                      </div>
                      <Badge className="text-lg px-4 py-2 font-black">
                        {reward.points} Points 🌟
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What You Can Win */}
          <Card className="border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
            <CardHeader className="text-center">
              <div className="text-5xl mb-2">✨</div>
              <CardTitle className="text-3xl font-black">What You Can Win!</CardTitle>
              <CardDescription className="font-bold">Amazing prizes await you!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-purple-200">
                  <div className="text-3xl">🎖️</div>
                  <p className="font-bold">Exclusive badges & certificates</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-purple-200">
                  <div className="text-3xl">🎁</div>
                  <p className="font-bold">Free premium features</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-purple-200">
                  <div className="text-3xl">🏆</div>
                  <p className="font-bold">Leaderboard recognition</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-purple-200">
                  <div className="text-3xl">⭐</div>
                  <p className="font-bold">Special rewards & surprises</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Referral;
