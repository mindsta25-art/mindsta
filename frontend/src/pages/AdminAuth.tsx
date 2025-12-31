import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, ArrowLeft, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { adminSignIn } from "@/api";
import mindstaLogo from "../assets/icons/mindsta2.png";

const AdminAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information! ⚠️",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting admin login with:', { email });
      const user = await adminSignIn({ email, password });
      console.log('✅ Admin login successful:', user);
      console.log('   User Type:', user.userType);
      console.log('   Token stored:', !!localStorage.getItem('authToken'));
      console.log('   User stored:', !!localStorage.getItem('currentUser'));

      // Refresh auth context to sync the user state
      refreshUser();
      console.log('🔄 Auth context refreshed');

      // Check localStorage after refresh
      const storedUser = localStorage.getItem('currentUser');
      console.log('📦 Current localStorage user:', storedUser ? JSON.parse(storedUser) : null);

      toast({
        title: "Welcome Admin! 👋",
        description: "Successfully logged in to admin panel.",
      });
      
      // Navigate immediately - the ProtectedRoute will handle auth check
      console.log('🚀 Navigating to /admin');
      navigate("/admin", { replace: true });
    } catch (error: any) {
      console.error("❌ Admin login error:", error);
      console.error("Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      // Extract meaningful error message
      let errorMessage = "An unexpected error occurred.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for common error patterns
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running on port 3000.";
      } else if (errorMessage.includes("Invalid email or password")) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (errorMessage.includes("Access denied")) {
        errorMessage = "Access denied. Admin privileges required.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-background dark:via-muted dark:to-background relative overflow-hidden">
      {/* Professional Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-card backdrop-blur-sm shadow-md border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <img src={mindstaLogo} alt="Mindsta Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Mindsta Admin</h1>
                <span className="text-xs text-muted-foreground font-medium">Secure Access Portal</span>
              </div>
            </div>
            
            {/* Desktop Back Button */}
            <Button
              onClick={() => navigate("/")}
              className="hidden md:flex gap-2 border-2 border-gray-300 hover:border-gray-500 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
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
                className="w-full gap-2 border-2 border-gray-300 hover:border-gray-500 font-medium justify-center"
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
        <Card className="w-full max-w-md border-2 border-gray-200 shadow-xl bg-white dark:bg-card">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Login
            </CardTitle>
            <CardDescription className="text-base font-medium text-gray-600 dark:text-gray-400">
              Secure access to the admin control panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Admin Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Sign In to Admin Panel
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  <Shield className="w-4 h-4 inline mr-2 text-blue-600" />
                  This is a secure admin area. Only authorized personnel with admin credentials can access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-card backdrop-blur-sm border-t border-gray-200 py-3 z-40">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 Mindsta Admin Panel. All rights reserved. | Secure Access Only
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminAuth;
