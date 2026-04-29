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
import { BookOpen, Gift, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, Loader2, TrendingUp, DollarSign, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp, requestPasswordReset } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

const ReferralAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const mode = searchParams.get("mode");
  
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
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
        title: "Missing Information! âš ï¸",
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

      // Unverified account â€” redirect to OTP page
      if (result?.requiresVerification) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });
        navigate('/verify-email', { state: { email: loginEmail, resent: false } });
        return;
      }

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
      setLoginAttempts(0);
      
      // Force refresh user context
      refreshUser();
      
      // Navigate with replace to prevent back button issues
      navigate("/referral/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      // Account exists but email not verified â€” redirect to OTP page
      if (error?.requiresVerification) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to continue.",
          variant: "destructive",
        });
        navigate('/verify-email', { state: { email: loginEmail, resent: false } });
        return;
      }
      setLoginAttempts((n) => n + 1);
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
      const result = await signUp({
        email,
        password,
        fullName: `${firstName} ${lastName}`,
        userType: 'referral',
        grade: undefined,
        age: undefined,
        referralCode: referralCode || undefined,
      });

      toast({
        title: "Account Created! 🎉",
        description: "Please check your email for a verification code to activate your account.",
      });

      // Redirect to OTP verification page
      navigate('/verify-email', { state: { email, resent: result?.resent || false } });
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
    <div className="min-h-screen flex">
      {/* Left Panel â€” Brand Hero */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6d28d9 0%, #9333ea 40%, #db2777 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(236,72,153,0.25)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(147,51,234,0.2)" }} />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 mb-12 group w-fit">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-colors">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">Mindsta</span>
              <span className="block text-[10px] text-purple-200 leading-tight">Referral Partner Portal</span>
            </div>
          </button>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              {isLogin ? "Welcome\nback, Partner!" : "Join Our\nPartner Network"}
            </h2>
            <p className="text-purple-200 text-lg leading-relaxed mb-10 max-w-sm">
              {isLogin
                ? "Log in to access your referral dashboard, track your earnings and manage payouts."
                : "Earn commissions by referring students to Mindsta. Get paid for every successful referral."}
            </p>
            <ul className="space-y-4">
              {[
                { icon: Gift, text: "Earn commissions on every successful student referral" },
                { icon: TrendingUp, text: "Real-time dashboard to monitor referrals and earnings" },
                { icon: DollarSign, text: "Fast payouts directly to your Nigerian bank account" },
                { icon: Users, text: "Join hundreds of active referral partners nationwide" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/15 rounded-lg mt-0.5 shrink-0">
                    <Icon className="w-4 h-4 text-purple-100" />
                  </div>
                  <span className="text-purple-100 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10">
            {[{ value: "5,000+", label: "Students" }, { value: "200+", label: "Lessons" }, { value: "6", label: "Grade Levels" }].map(s => (
              <div key={s.label}>
                <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs sm:text-sm text-pink-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel â€” Form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-background overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Mindsta</span>
          </button>
          <button onClick={() => navigate("/")} className="text-sm flex items-center gap-1" style={{ color: "#9333ea" }}>
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            {/* Tab Switch */}
            <div className="flex bg-gray-100 dark:bg-muted rounded-xl p-1 mb-8">
              {["Log In", "Register"].map((label, i) => {
                const active = i === 0 ? isLogin : !isLogin;
                return (
                  <button key={label} onClick={() => setIsLogin(i === 0)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      active
                        ? 'bg-white dark:bg-card shadow'
                        : 'text-gray-500 dark:text-muted-foreground hover:text-gray-700'
                    }`}
                    style={active ? { color: "#9333ea" } : {}}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLogin ? "Welcome back, Partner" : "Create your partner account"}
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground text-sm mt-1">
                {isLogin ? "Enter your credentials to access your referral dashboard." : "Sign up to start earning commissions."}
              </p>
            </div>

            {referralCode && !isLogin && (
              <div className="mb-5 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  🎉 You're using referral code: <span className="font-bold">{referralCode}</span>
                </p>
              </div>
            )}

            {isLogin ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 pl-10 border-gray-200 dark:border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                    <button type="button" onClick={() => setShowForgotPasswordDialog(true)}
                      className="text-xs hover:underline" style={{ color: "#9333ea" }}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 border-gray-200 dark:border-border"
                      required
                    />
                    <button type="button" onClick={() => setShowLoginPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Login attempt warning */}
                {loginAttempts > 0 && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {loginAttempts === 1
                        ? "1 failed login attempt."
                        : `${loginAttempts} failed login attempts.`}{" "}
                      Please check your email and password.
                      {loginAttempts >= 3 && (
                        <>{" "}<button type="button" className="underline font-semibold" onClick={() => setShowForgotPasswordDialog(true)}>Forgot your password?</button></>
                      )}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md"
                >
                  {loading ? "Logging In..." : "Log In to Dashboard"}
                </Button>

                {/* Google OAuth */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-background px-3 text-xs text-gray-400 uppercase tracking-wide">or continue with</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={async () => {
                    const backendURL = import.meta.env.VITE_API_URL
                      ? import.meta.env.VITE_API_URL
                      : import.meta.env.PROD
                      ? 'https://api.mindsta.com.ng/api'
                      : 'http://localhost:3000/api';
                    setGoogleLoading(true);
                    window.location.href = `${backendURL}/auth/google?userType=referral`;
                  }}
                  className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border font-medium text-sm transition-all disabled:opacity-50"
                  style={{ borderColor: '#e2e8f0', color: '#374151', background: '#ffffff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
                >
                  {googleLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin shrink-0" /><span style={{ color: '#374151' }}>Redirecting to Google…</span></>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span style={{ color: '#374151' }}>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button onClick={() => setIsLogin(false)}
                    className="text-sm hover:underline font-medium" style={{ color: "#9333ea" }}>
                    Don't have an account? Register here
                  </button>
                </div>
              </form>
            ) : (
              // Register Form
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-11 pl-10 border-gray-200 dark:border-border"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="last-name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-11 pl-10 border-gray-200 dark:border-border"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 border-gray-200 dark:border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-11 pl-10 border-gray-200 dark:border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 border-gray-200 dark:border-border"
                      required
                    />
                    <button type="button" onClick={() => setShowRegisterPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 border-gray-200 dark:border-border"
                      required
                    />
                    <button type="button" onClick={() => setShowRegisterConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      I agree to the{" "}
                      <button type="button" className="underline font-medium" style={{ color: "#9333ea" }} onClick={() => window.open("/terms", "_blank")}>
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
                    <label htmlFor="privacy" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      I agree to the{" "}
                      <button type="button" className="underline font-medium" style={{ color: "#9333ea" }} onClick={() => window.open("/privacy", "_blank")}>
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md"
                >
                  {loading ? "Creating Account..." : "Create Partner Account"}
                </Button>

                {/* Google OAuth */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-background px-3 text-xs text-gray-400 uppercase tracking-wide">or sign up with</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={async () => {
                    const backendURL = import.meta.env.VITE_API_URL
                      ? import.meta.env.VITE_API_URL
                      : import.meta.env.PROD
                      ? 'https://api.mindsta.com.ng/api'
                      : 'http://localhost:3000/api';
                    setGoogleLoading(true);
                    window.location.href = `${backendURL}/auth/google?userType=referral`;
                  }}
                  className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border font-medium text-sm transition-all disabled:opacity-50"
                  style={{ borderColor: '#e2e8f0', color: '#374151', background: '#ffffff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
                >
                  {googleLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin shrink-0" /><span style={{ color: '#374151' }}>Redirecting to Google…</span></>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span style={{ color: '#374151' }}>Sign up with Google</span>
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button onClick={() => setIsLogin(true)}
                    className="text-sm hover:underline font-medium" style={{ color: "#9333ea" }}>
                    Already have an account? Log in here
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 text-center">
              <button onClick={() => navigate("/")}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
                <ArrowLeft className="w-3 h-3" /> Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

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
            <Button onClick={handleForgotPassword} disabled={forgotLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              {forgotLoading ? "Sending..." : "Send reset link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralAuth;
