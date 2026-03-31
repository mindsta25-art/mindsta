import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, Gift, Menu, X } from "lucide-react";

export const HomeHeader = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close mobile menu when user clicks outside the header
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-card backdrop-blur-sm shadow-lg border-b-4 border-purple-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform" 
            onClick={() => navigate("/")}
          >
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            <div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mindsta
              </span>
              <span className="text-[10px] block text-muted-foreground leading-tight">
                ... Every Child Can Do Well
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              onClick={() => navigate("/referral-auth")}
              variant="outline"
              className="gap-2 hover:scale-110 transition-all duration-300 border-2 border-yellow-300 hover:border-yellow-500 hover:shadow-lg font-bold"
              title="Sign up as a Referrer - Earn rewards by inviting friends!"
            >
              <Gift className="w-4 h-4" />
              Refer & Earn 
            </Button>
            <Button 
              onClick={() => navigate("/auth?mode=login")}
              variant="outline"
              className="gap-2 hover:scale-110 transition-all duration-300 border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg"
              title="Student Login - Access your learning dashboard"
            >
              <Shield className="w-4 h-4" />
              Student Sign In
            </Button>
            <Button 
              onClick={() => navigate("/auth?mode=register")}
              className="gap-2 hover:scale-110 transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold"
              title="Student Registration - Start your learning journey!"
            >
              Student Sign Up 
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
                navigate("/referral-auth");
                setMobileMenuOpen(false);
              }}
              variant="outline"
              className="w-full gap-2 border-2 border-yellow-300 hover:border-yellow-500 font-bold justify-center"
            >
              <Gift className="w-4 h-4" />
              Refer & Earn 
            </Button>
            <Button 
              onClick={() => {
                navigate("/auth?mode=login");
                setMobileMenuOpen(false);
              }}
              variant="outline"
              className="w-full gap-2 border-2 border-purple-300 hover:border-purple-500 justify-center"
            >
              <Shield className="w-4 h-4" />
              Student Sign In
            </Button>
            <Button 
              onClick={() => {
                navigate("/auth?mode=register");
                setMobileMenuOpen(false);
              }}
              className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold justify-center"
            >
              Student Sign Up 
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
