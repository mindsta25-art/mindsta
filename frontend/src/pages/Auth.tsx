import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  BookOpen, Eye, EyeOff, Star, Users, Trophy, ArrowLeft,
  CheckCircle, XCircle, AlertCircle, Loader2, ShieldCheck,
} from "lucide-react";
import { signUp, signIn, requestPasswordReset } from "@/api";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { signInSchema, signUpSchema, SignInFormData, SignUpFormData } from "@/lib/validations";

const getPasswordStrength = (pw: string): { score: number; label: string; color: string; bg: string } => {
  if (!pw) return { score: 0, label: "", color: "", bg: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: "Weak", color: "text-red-500", bg: "bg-red-500" };
  if (score <= 4) return { score, label: "Fair", color: "text-amber-500", bg: "bg-amber-500" };
  if (score === 5) return { score, label: "Good", color: "text-blue-500", bg: "bg-blue-500" };
  return { score, label: "Strong", color: "text-green-500", bg: "bg-green-500" };
};

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

  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken" | "unverified">("idle");
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loginForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "", email: "", password: "", confirmPassword: "",
      userType: "student", grade: "", age: "", schoolName: "",
      referralCode: referralCode || "",
    },
  });

  const watchedPassword = signupForm.watch("password");
  const watchedConfirm = signupForm.watch("confirmPassword");
  const passwordStrength = getPasswordStrength(watchedPassword);
  const passwordsMatch = watchedPassword && watchedConfirm ? watchedPassword === watchedConfirm : null;

  const checkEmailAvailability = useCallback((email: string) => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/auth/check-email', { email });
        if (res.available) {
          setEmailStatus("available");
        } else if (res.unverified) {
          setEmailStatus("unverified");
        } else {
          setEmailStatus("taken");
        }
      } catch {
        setEmailStatus("idle");
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (!isLogin) setEmailStatus("idle");
  }, [isLogin]);

  // Handle redirect from Google OAuth when user needs OTP verification
  useEffect(() => {
    const requiresVerification = searchParams.get('requiresVerification');
    const emailParam = searchParams.get('email');
    if (requiresVerification === 'true' && emailParam) {
      navigate('/verify-email', {
        state: { email: emailParam, resent: false, emailSent: true },
      });
    }
  }, []);

  const onSignup = async (data: SignUpFormData) => {
    try {
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

      if (result.requiresVerification) {
        toast({
          title: result.emailSent === false ? "✅ Account Created" : "🎉 Account Created!",
          description: result.emailSent === false
            ? "Email delivery failed — tap \"Resend Code\" on the next screen."
            : "Check your email for your verification code.",
        });
        navigate('/verify-email', {
          state: { email: result.email || data.email, resent: result.resent || false, emailSent: result.emailSent !== false },
        });
      } else {
        toast({ title: "🎉 Account created!", description: "Please log in to continue." });
        navigate(`/auth?mode=login&type=${userType}`);
      }
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message || "An error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (data: SignInFormData) => {
    try {
      setLoading(true);
      const result = await signIn({ email: data.email, password: data.password });

      if (result.userType !== 'student') {
        toast({
          title: "Access Denied",
          description: result.userType === 'admin'
            ? "Admin accounts must use the admin portal. Redirecting..."
            : "Only students can log in here. Please use the correct portal.",
          variant: "destructive",
        });
        setTimeout(() => {
          if (result.userType === 'admin') navigate("/admin-auth");
          else if (result.userType === 'referral') navigate("/referral-auth?mode=login");
        }, 2000);
        return;
      }

      toast({ title: "Welcome back!", description: "Logged in successfully." });
      refreshUser();
      navigate('/dashboard');
    } catch (error: any) {
      if (error.requiresVerification || error.message?.includes('verify your email')) {
        toast({ title: "Email Not Verified", description: "Please verify your email before logging in.", variant: "destructive" });
        navigate('/verify-email', { state: { email: error.email || data.email, resent: false } });
        return;
      }
      if (error.message?.includes('admin portal') || error.message?.includes('Admin accounts')) {
        toast({ title: "Admin Access Blocked", description: "Please use the admin portal to log in.", variant: "destructive" });
        setTimeout(() => navigate("/admin-auth"), 2000);
      } else {
        toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
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
      {/* Left Panel — Brand Hero */}
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
              <span className="block text-[10px] text-purple-200 leading-tight">... Every Child Can Do Well</span>
            </div>
          </button>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              {isLogin ? "Welcome\nback!" : "Start your\nlearning journey"}
            </h2>
            <p className="text-purple-200 text-lg leading-relaxed mb-10 max-w-sm">
              {isLogin
                ? "Log in to continue where you left off. Your lessons, progress and achievements are waiting."
                : "Join thousands of students mastering core subjects with expert-designed lessons and instant feedback."}
            </p>
            <ul className="space-y-4">
              {[
                { icon: BookOpen, text: "Curriculum-aligned lessons for Grades 1–6 & Common Entrance" },
                { icon: Trophy, text: "Earn achievements and track progress on the leaderboard" },
                { icon: Star, text: "Interactive quizzes with instant explanations" },
                { icon: Users, text: "Thousands of students learning every day" },
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

          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
            {[{ value: "5,000+", label: "Students" }, { value: "200+", label: "Lessons" }, { value: "6", label: "Grade Levels" }].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-pink-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-background overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</span>
              <span className="text-[10px] block text-muted-foreground leading-tight">... Every Child Can Do Well</span>
            </div>
          </button>
          <button onClick={() => navigate("/")} className="text-sm flex items-center gap-1" style={{ color: "#9333ea" }}>
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">

            {/* Tab Switch */}
            <div className="flex bg-gray-100 dark:bg-muted rounded-xl p-1 mb-4 sm:mb-8">
              {["Log In", "Create Account"].map((label, i) => {
                const active = i === 0 ? isLogin : !isLogin;
                return (
                  <button key={label} onClick={() => setIsLogin(i === 0)}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
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
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground text-sm mt-1">
                {isLogin ? "Enter your credentials to access your dashboard." : "Sign up as a student to get started."}
              </p>
            </div>

            {/* Google Button */}
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={async () => {
                const backendURL = import.meta.env.VITE_API_URL
                  ? import.meta.env.VITE_API_URL
                  : import.meta.env.PROD
                  ? 'https://api.mindsta.com.ng/api'
                  : 'http://localhost:3000/api';
                setGoogleLoading(true);
                window.location.href = `${backendURL}/auth/google`;
              }}
              className="w-full flex items-center justify-center gap-3 h-11 mb-5 px-4 rounded-lg border font-medium text-sm transition-all disabled:opacity-50"
              style={{
                borderColor: "#e2e8f0",
                color: "#374151",
                background: "#ffffff",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
              }}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span style={{ color: "#374151" }}>Redirecting to Google…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span style={{ color: "#374151" }}>{isLogin ? "Continue" : "Sign up"} with Google</span>
                </>
              )}
            </button>

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

              {/* ── SIGNUP-ONLY FIELDS ── */}
              {!isLogin && (
                <>
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                    <Input id="fullName" type="text" {...signupForm.register("fullName")} maxLength={100}
                      className="h-11 border-gray-200 dark:border-border" placeholder="Your full name" />
                    {signupForm.formState.errors.fullName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />{signupForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Grade + Age */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="grade" className="text-sm font-medium text-gray-700 dark:text-gray-300">Grade</Label>
                      <Select value={signupForm.watch("grade")} onValueChange={(v) => signupForm.setValue("grade", v)}>
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
                      <Select value={signupForm.watch("age")} onValueChange={(v) => signupForm.setValue("age", v)}>
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

                  {/* School Name */}
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

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                <div className="relative">
                  <Input id="email" type="email" maxLength={255}
                    {...(isLogin ? loginForm.register("email") : signupForm.register("email", {
                      onChange: (e) => { if (!isLogin) checkEmailAvailability(e.target.value); },
                    }))}
                    className={`h-11 border-gray-200 dark:border-border pr-9 ${
                      !isLogin && emailStatus === "taken" ? "border-red-400 focus:border-red-400" :
                      !isLogin && emailStatus === "available" ? "border-green-400 focus:border-green-400" : ""
                    }`}
                    placeholder="you@example.com" />
                  {!isLogin && emailStatus !== "idle" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {emailStatus === "available" && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {(emailStatus === "taken" || emailStatus === "unverified") && <AlertCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                  )}
                </div>
                {!isLogin && emailStatus === "available" && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Email is available</p>
                )}
                {!isLogin && emailStatus === "taken" && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />This email is already registered.{" "}
                    <button type="button" className="underline" style={{ color: "#9333ea" }} onClick={() => setIsLogin(true)}>Log in instead</button>
                  </p>
                )}
                {!isLogin && emailStatus === "unverified" && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#d97706" }}>
                    <AlertCircle className="w-3 h-3" />Account exists but is unverified. Submit to resend the code.
                  </p>
                )}
                {isLogin && loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
                {!isLogin && signupForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                  {isLogin && (
                    <button type="button" onClick={() => setShowForgotPasswordDialog(true)}
                      className="text-xs hover:underline" style={{ color: "#9333ea" }}>
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

                {/* Password strength meter (signup only) */}
                {!isLogin && watchedPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= i * 1.5
                            ? passwordStrength.bg
                            : "bg-gray-200 dark:bg-gray-700"
                        }`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className={/[A-Z]/.test(watchedPassword) ? "text-green-500" : ""}>
                          {/[A-Z]/.test(watchedPassword) ? "✓" : "·"} Uppercase
                        </span>
                        <span className={/[a-z]/.test(watchedPassword) ? "text-green-500" : ""}>
                          {/[a-z]/.test(watchedPassword) ? "✓" : "·"} Lowercase
                        </span>
                        <span className={/[0-9]/.test(watchedPassword) ? "text-green-500" : ""}>
                          {/[0-9]/.test(watchedPassword) ? "✓" : "·"} Number
                        </span>
                        <span className={watchedPassword.length >= 8 ? "text-green-500" : ""}>
                          {watchedPassword.length >= 8 ? "✓" : "·"} 8+ chars
                        </span>
                      </div>
                      {passwordStrength.label && (
                        <span className={`text-xs font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                      )}
                    </div>
                  </div>
                )}

                {isLogin && loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
                {!isLogin && signupForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password + Referral (signup only) */}
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                        {...signupForm.register("confirmPassword")} maxLength={100}
                        className={`h-11 dark:border-border pr-10 ${
                          passwordsMatch === true ? "border-green-400 focus:border-green-400" :
                          passwordsMatch === false ? "border-red-400 focus:border-red-400" :
                          "border-gray-200"
                        }`}
                        placeholder="••••••••" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {watchedConfirm && (
                          passwordsMatch
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                          className="text-gray-400 hover:text-gray-600" tabIndex={-1}>
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {watchedConfirm && !passwordsMatch && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />Passwords don't match
                      </p>
                    )}
                    {watchedConfirm && passwordsMatch && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Passwords match
                      </p>
                    )}
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

              {/* Submit */}
              <Button type="submit"
                className="w-full h-12 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={loading || (!isLogin && emailStatus === "taken")}>
                {loading
                  ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />Processing...</>
                  : isLogin ? "Log In to My Account" : "Create Account"}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={() => setIsLogin(!isLogin)}
                className="text-sm hover:underline font-medium" style={{ color: "#9333ea" }}>
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
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-border flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure & Encrypted</span>
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

export default Auth;