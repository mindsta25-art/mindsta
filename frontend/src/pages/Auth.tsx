import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HomeHeader } from "@/components/HomeHeader";
import { HomeFooter } from "@/components/HomeFooter";
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
import { BookOpen, Eye, EyeOff } from "lucide-react";
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
        toast({
          title: "🎉 Account created!",
          description: "Please check your email for verification code.",
        });

        // Redirect to verification page
        navigate('/verify-email', { 
          state: { 
            email: result.email || data.email,
            resent: result.resent || false
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-muted dark:to-background">
      <HomeHeader />

      <main className="pt-24 pb-16 relative min-h-[calc(100vh-4rem)] flex items-start justify-center p-4">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-5xl animate-bounce delay-200">🌟</div>
        <div className="absolute top-20 right-20 text-5xl animate-bounce delay-500">🎈</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-bounce delay-700">🎨</div>
        <div className="absolute bottom-32 right-32 text-5xl animate-bounce delay-1000">🚀</div>
      </div>

      <Card className="w-full max-w-md p-8 bg-white/95 dark:bg-card shadow-2xl border-4 border-purple-300 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-4 animate-pulse">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</h1>
          <p className="text-muted-foreground mt-2 font-bold text-lg">
            {isLogin ? "Welcome Back to Excellence! " : `Begin Your Learning Journey! `}
          </p>
          {/* Removed alt statement from logo as requested */}
          {!isLogin && (
            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
              Sign up as a {userType === "student" ? "Student " : userType === "parent" ? "Parent 👨‍👩‍👧" : "Educator 👨‍🏫"}
            </p>
          )}
        </div>

        <form onSubmit={isLogin ? loginForm.handleSubmit(onLogin) : signupForm.handleSubmit(onSignup)} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  {...signupForm.register("fullName")}
                  maxLength={100}
                />
                {signupForm.formState.errors.fullName && (
                  <p className="text-sm text-red-500">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={signupForm.watch("grade")}
                    onValueChange={(value) => signupForm.setValue("grade", value)}
                  >
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          Grade {g}
                        </SelectItem>
                      ))}
                      <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                    </SelectContent>
                  </Select>
                  {signupForm.formState.errors.grade && (
                    <p className="text-sm text-red-500">{signupForm.formState.errors.grade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Select
                    value={signupForm.watch("age")}
                    onValueChange={(value) => signupForm.setValue("age", value)}
                  >
                    <SelectTrigger id="age">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((a) => (
                        <SelectItem key={a} value={a.toString()}>
                          {a} years
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {signupForm.formState.errors.age && (
                    <p className="text-sm text-red-500">{signupForm.formState.errors.age.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName">Name of School</Label>
                <Input
                  id="schoolName"
                  type="text"
                  {...signupForm.register("schoolName")}
                  maxLength={200}
                />
                {signupForm.formState.errors.schoolName && (
                  <p className="text-sm text-red-500">{signupForm.formState.errors.schoolName.message}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...(isLogin ? loginForm.register("email") : signupForm.register("email"))}
              maxLength={255}
            />
            {isLogin ? (
              loginForm.formState.errors.email && (
                <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
              )
            ) : (
              signupForm.formState.errors.email && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...(isLogin ? loginForm.register("password") : signupForm.register("password"))}
                maxLength={100}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isLogin ? (
              loginForm.formState.errors.password && (
                <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
              )
            ) : (
              signupForm.formState.errors.password && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>
              )
            )}
            {!isLogin && (
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...signupForm.register("confirmPassword")}
                  maxLength={100}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="flex items-center gap-2">
                Referral Code 
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code if you have one"
                {...signupForm.register("referralCode")}
                maxLength={50}
              />
              {signupForm.formState.errors.referralCode && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.referralCode.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Got a friend's referral code? Enter it to give them rewards! 
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-black text-lg py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            disabled={loading}
          >
            {loading ? "Processing... " : isLogin ? "Access Account " : "Begin Learning Journey! "}
          </Button>
        </form>

        {/* OR Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 py-6 shadow-md hover:shadow-lg transition-all"
          onClick={() => {
            const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            window.location.href = `${backendURL}/api/auth/google`;
          }}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-semibold">{isLogin ? "Sign in" : "Sign up"} with Google</span>
        </Button>

        {isLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgotPasswordDialog(true)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 dark:text-purple-400 hover:underline font-bold text-base"
          >
            {isLogin
              ? "New here? Begin your journey! "
              : "Already a member? Log in! "}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            ← Back to Home
          </button>
        </div>
      </Card>

      </main>

      <HomeFooter />

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
