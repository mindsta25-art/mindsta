import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Eye, EyeOff, Star, Users, Trophy, ArrowLeft, CheckCircle } from "lucide-react";
import { signUp, signIn, requestPasswordReset } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { signInSchema, signUpSchema, SignInFormData, SignUpFormData } from "@/lib/validations";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "student";
  const referralCode = searchParams.get("ref") || undefined;
  const mode = searchParams.get("mode");
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  // Login form
  const loginForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form
  const signupForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: "student",
      grade: "",
      age: "",
      schoolName: "",
      referralCode: referralCode || "",
    },
  });

  const onSignup = async (data: SignUpFormData) => {
    try {
      console.log('🚀 Starting signup...', data);
      setLoading(true);

      const result = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        userType: userType as any,
        grade: data.grade,
        age: parseInt(data.age || "0"),
        schoolName: data.schoolName,
        referralCode: data.referralCode,
      });
      
      console.log('✅ Signup successful:', result);

      // Check if email verification is required
      if (result.requiresVerification) {
        if (result.emailSent === false) {
          toast({
            title: "✅ Account created!",
            description: "Email delivery failed — tap \"Resend Code\" on the next screen.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "🎉 Account created!",
            description: "Please check your email for your verification code.",
          });
        }

        // Redirect to verification page
        navigate('/verify-email', { 
          state: { 
            email: result.email || data.email,
            resent: result.resent || false,
            emailSent: result.emailSent !== false,
          } 
        });
      } else {
        // Admin or other users who don't need verification
        toast({
          title: "🎉 Account created!",
          description: "Please log in to continue.",
        });

        // Redirect to login page
        navigate(`/auth?mode=login&type=${userType}`);
      }
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (data: SignInFormData) => {
    try {
      console.log('🚀 Starting login...', { email: data.email });
      setLoading(true);

      const result = await signIn({
        email: data.email,
        password: data.password,
      });
      
      console.log('✅ Login successful:', result);

      // Block admin and referral accounts from student dashboard
      if (result.userType !== 'student') {
        toast({
          title: "Access Denied",
          description: result.userType === 'admin'
            ? "Admin accounts must use the admin portal. Redirecting..."
            : "Only students can log in here. Please use the correct portal.",
          variant: "destructive",
        });
        setTimeout(() => {
          if (result.userType === 'admin') {
            navigate("/admin-auth");
          } else if (result.userType === 'referral') {
            navigate("/referral-auth?mode=login");
          }
        }, 2000);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Logged in successfully.",
      });

      // Immediately sync auth context and navigate to dashboard (students only)
      refreshUser();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Check if user needs email verification
      if (error.requiresVerification || error.message?.includes('verify your email')) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });
        
        // Redirect to verification page
        navigate('/verify-email', { 
          state: { 
            email: error.email || data.email,
            resent: false
          } 
        });
        return;
      }
      
      // Check if error is about admin access
      if (error.message?.includes('admin portal') || error.message?.includes('Admin accounts')) {
        toast({
          title: "Admin Access Blocked",
          description: "Please use the admin portal to log in.",
          variant: "destructive",
        });
        setTimeout(() => {
          navigate("/admin-auth");
        }, 2000);
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
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
      {/* ─── Left Panel — Brand Hero (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        {/* Glow blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-colors">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">Mindsta</span>
                <span className="block text-[10px] text-indigo-200 leading-tight">Every Child Can Do Well</span>
              </div>
            </button>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              {isLogin ? "Welcome\nback!" : "Start your\nlearning journey"}
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed mb-10 max-w-sm">
              {isLogin
                ? "Log in to continue where you left off. Your lessons, progress and achievements are waiting."
                : "Join thousands of students mastering core subjects with expert-designed lessons and instant feedback."}
            </p>

            {/* Feature bullets */}
            <ul className="space-y-4">
              {[
                { icon: BookOpen, text: "Curriculum-aligned lessons for Grades 1–6 & Common Entrance" },
                { icon: Trophy,   text: "Earn achievements and track progress on the leaderboard" },
                { icon: Star,     text: "Interactive quizzes with instant explanations" },
                { icon: Users,    text: "Thousands of students learning every day" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/15 rounded-lg mt-0.5 shrink-0">
                    <Icon className="w-4 h-4 text-indigo-100" />
                  </div>
                  <span className="text-indigo-100 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
            {[{ value: "5,000+", label: "Students" }, { value: "200+", label: "Lessons" }, { value: "6", label: "Grade Levels" }].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-indigo-300">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Form ─── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-background overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Mindsta</span>
          </button>
          <button onClick={() => navigate("/")} className="text-sm text-indigo-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">

            {/* Tab Switch */}
            <div className="flex bg-gray-100 dark:bg-muted rounded-xl p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  isLogin
                    ? 'bg-white dark:bg-card shadow text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-muted-foreground hover:text-gray-700'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-white dark:bg-card shadow text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-muted-foreground hover:text-gray-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLogin ? "Welcome back" : `Create your account`}
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground text-sm mt-1">
                {isLogin
                  ? "Enter your credentials to access your dashboard."
                  : `Sign up as a ${userType === "student" ? "student" : userType === "parent" ? "parent" : "educator"} to get started.`}
              </p>
            </div>

            {/* Google Sign-In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-muted py-5 mb-5 font-medium"
              onClick={() => {
                const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                window.location.href = `${backendURL}/api/auth/google`;
              }}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLogin ? "Continue" : "Sign up"} with Google
            </Button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-background px-3 text-xs text-gray-400 uppercase tracking-wide">or with email</span>
              </div>
            </div>

            <form onSubmit={isLogin ? loginForm.handleSubmit(onLogin) : signupForm.handleSubmit(onSignup)} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                    <Input id="fullName" type="text" {...signupForm.register("fullName")} maxLength={100}
                      className="h-11 border-gray-200 dark:border-border focus:ring-indigo-500 focus:border-indigo-500" placeholder="Your full name" />
                    {signupForm.formState.errors.fullName && (
                      <p className="text-xs text-red-500">{signupForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="grade" className="text-sm font-medium text-gray-700 dark:text-gray-300">Grade</Label>
                      <Select value={signupForm.watch("grade")} onValueChange={(value) => signupForm.setValue("grade", value)}>
                        <SelectTrigger id="grade" className="h-11 border-gray-200 dark:border-border">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((g) => (
                            <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                          ))}
                          <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                        </SelectContent>
                      </Select>
                      {signupForm.formState.errors.grade && (
                        <p className="text-xs text-red-500">{signupForm.formState.errors.grade.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-sm font-medium text-gray-700 dark:text-gray-300">Age</Label>
                      <Select value={signupForm.watch("age")} onValueChange={(value) => signupForm.setValue("age", value)}>
                        <SelectTrigger id="age" className="h-11 border-gray-200 dark:border-border">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((a) => (
                            <SelectItem key={a} value={a.toString()}>{a} yrs</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {signupForm.formState.errors.age && (
                        <p className="text-xs text-red-500">{signupForm.formState.errors.age.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700 dark:text-gray-300">School Name</Label>
                    <Input id="schoolName" type="text" {...signupForm.register("schoolName")} maxLength={200}
                      className="h-11 border-gray-200 dark:border-border" placeholder="Name of your school" />
                    {signupForm.formState.errors.schoolName && (
                      <p className="text-xs text-red-500">{signupForm.formState.errors.schoolName.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                <Input id="email" type="email"
                  {...(isLogin ? loginForm.register("email") : signupForm.register("email"))} maxLength={255}
                  className="h-11 border-gray-200 dark:border-border" placeholder="you@example.com" />
                {isLogin ? loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                ) : signupForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                  {isLogin && (
                    <button type="button" onClick={() => setShowForgotPasswordDialog(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"}
                    {...(isLogin ? loginForm.register("password") : signupForm.register("password"))}
                    maxLength={100} className="h-11 border-gray-200 dark:border-border pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isLogin ? loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                ) : signupForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{signupForm.formState.errors.password.message}</p>
                )}
                {!isLogin && (
                  <p className="text-xs text-gray-400">Min. 8 characters with uppercase, lowercase &amp; number</p>
                )}
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                        {...signupForm.register("confirmPassword")} maxLength={100}
                        className="h-11 border-gray-200 dark:border-border pr-10" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Referral Code <span className="text-gray-400 font-normal">(optional)</span>
                    </Label>
                    <Input id="referralCode" type="text" placeholder="Enter referral code if you have one"
                      {...signupForm.register("referralCode")} maxLength={50}
                      className="h-11 border-gray-200 dark:border-border" />
                  </div>
                </>
              )}

              <Button type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all mt-2"
                disabled={loading}>
                {loading
                  ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>
                  : isLogin ? "Log In to My Account" : "Create Account"}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button onClick={() => navigate("/")}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
                <ArrowLeft className="w-3 h-3" /> Back to Home
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-border flex items-center justify-center gap-5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Secure & Encrypted</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> No Spam</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Free to Try</span>
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
            <Button onClick={handleForgotPassword} disabled={forgotLoading}>
              {forgotLoading ? "Sending..." : "Send reset link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
