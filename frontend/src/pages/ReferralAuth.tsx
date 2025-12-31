import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Gift, Mail, Lock, User, Phone, ArrowLeft, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp, requestPasswordReset } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import mindstaLogo from "../assets/icons/mindsta2.png";

const ReferralAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const mode = searchParams.get("mode");
  
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing Information! ⚠️",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({
        email: loginEmail,
        password: loginPassword,
      });

      // Block students and admins from referral dashboard
      if (result.userType !== 'referral') {
        toast({
          title: "Access Denied",
          description: result.userType === 'admin'
            ? "Admin accounts must use the admin portal. Redirecting..."
            : "Only referral users can log in here. Please use the correct portal.",
          variant: "destructive",
        });
        setTimeout(() => {
          if (result.userType === 'admin') {
            navigate("/admin-auth");
          } else if (result.userType === 'student') {
            navigate("/auth?mode=login&type=student");
          }
        }, 2000);
        return;
      }

      toast({
        title: "Welcome Back! 🎉",
        description: "Successfully logged in!",
      });
      // Ensure auth context is synced before navigating
      refreshUser();
      navigate("/referral");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error?.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      toast({
        title: "Missing Information! ",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch! ",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password! ",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Terms Required! ",
        description: "You must agree to the Terms and Conditions.",
        variant: "destructive",
      });
      return;
    }

    if (!agreeToPrivacy) {
      toast({
        title: "Privacy Required! ",
        description: "You must agree to the Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await signUp({
        email,
        password,
        fullName: `${firstName} ${lastName}`,
        userType: 'referral',
        grade: undefined,
        age: undefined,
        schoolName: undefined,
        referralCode: referralCode || undefined,
      });

      toast({
        title: "Account created! ",
        description: referralCode 
          ? "Please log in to start earning rewards with your referral."
          : "Please log in to continue.",
      });

      // Redirect to referral login page
      navigate("/referral-auth?mode=login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({ title: "Email required", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      await requestPasswordReset(forgotEmail);
      toast({ title: "Email sent!", description: "Check your inbox for a password reset link." });
      setShowForgotPasswordDialog(false);
      setForgotEmail("");
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Unable to send reset email.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-background dark:via-muted dark:to-background relative overflow-hidden">
      {/* Fun Background Elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl animate-bounce delay-200">🎁</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce delay-500">⭐</div>
        <div className="absolute bottom-20 left-20 text-4xl animate-bounce delay-700">💰</div>
        <div className="absolute bottom-32 right-32 text-4xl animate-bounce delay-1000">🎉</div>
      </div> */}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-card backdrop-blur-sm shadow-lg border-b-4 border-yellow-300 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 animate-pulse">
                <img src={mindstaLogo} alt="Mindsta Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Mindsta Referral</h1>
                <span className="text-xs text-muted-foreground font-bold">Refer Friends • Earn Rewards! </span>
              </div>
            </div>
            
            {/* Desktop Back Button */}
            <Button
              onClick={() => navigate("/")}
              className="hidden md:flex gap-2 border-2 border-yellow-300 hover:border-yellow-500 font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-yellow-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-yellow-600" />
              ) : (
                <Menu className="w-6 h-6 text-yellow-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 animate-in slide-in-from-top-5 duration-200">
              <Button
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 border-2 border-yellow-300 hover:border-yellow-500 font-bold justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative z-10 mt-20 flex items-center justify-center min-h-[calc(100vh-160px)]">
        <Card className="w-full max-w-md border-4 border-yellow-300 shadow-2xl bg-white dark:bg-card">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4 animate-bounce"></div> 
            <CardTitle className="text-3xl font-black">
              {isLogin ? "Welcome Back!" : "Join the Referral Program!"}
            </CardTitle>
            <CardDescription className="text-lg font-bold">
              {isLogin ? "Login to your referral account" : "Create your account and start earning rewards!"}
            </CardDescription>
            {referralCode && !isLogin && (
              <div className="mt-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm font-bold text-green-700">
                  🎉 You're using referral code: <span className="font-black">{referralCode}</span>
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {isLogin ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="font-bold">Email Address </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="font-bold">Password </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-lg font-black py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  {loading ? "Logging In..." : "Login "}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordDialog(true)}
                    className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline"
                  >
                    Forgot password? 
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline"
                  >
                    Don't have an account? Register here! 
                  </button>
                </div>
              </form>
            ) : (
              // Register Form
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="font-bold">First Name </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="font-bold">Last Name </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="last-name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Email Address </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Phone Number </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-bold">Confirm Password </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 border-2 border-yellow-200 focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-yellow-600 hover:text-yellow-700 underline font-bold"
                        onClick={() => window.open("/terms", "_blank")}
                      >
                        Terms and Conditions
                      </button>
                    </label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={agreeToPrivacy}
                      onCheckedChange={(checked) => setAgreeToPrivacy(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-yellow-600 hover:text-yellow-700 underline font-bold"
                        onClick={() => window.open("/privacy", "_blank")}
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-lg font-black py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  {loading ? "Creating Account..." : "Create Account "}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline"
                  >
                    Already have an account? Login here! 
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>Enter your email and we'll send you a reset link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email Address</Label>
            <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleForgotPassword} disabled={forgotLoading}>
              {forgotLoading ? "Sending..." : "Send reset link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralAuth;
