import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  LogOut,
  Shield,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import { signOut } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { formatUserName } from "@/lib/stringUtils";
import { AdminAlertBell } from "@/components/AdminAlertBell";

const ADMIN_ROUTE_MAP: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/newsletter': 'Newsletter',
  '/admin/content': 'Content Management',
  '/admin/create-lesson': 'Create Lesson',
  '/admin/create-quiz': 'Create Quiz',
  '/admin/lessons': 'Draft Lessons',
  '/admin/lesson-management': 'Lesson Management',
  '/admin/drafts': 'Draft Lessons',
  '/admin/subjects': 'Subject Management',
  '/admin/topics': 'Topic Management',
  '/admin/referrals': 'Referral Management',
  '/admin/referral-payouts': 'Referral Payouts',
  '/admin/analytics': 'Analytics',
  '/admin/reports': 'Reports',
  '/admin/financial-report': 'Financial Report',
  '/admin/settings': 'Settings',
  '/admin/notifications': 'Notifications',
  '/admin/suggestions': 'Suggestions',
  '/admin/questions': 'Questions',
  '/admin/tickets': 'Support Tickets',
  '/admin/leaderboard': 'Leaderboard',
  '/admin/bundles': 'Bundle Management',
  '/admin/alerts': 'Admin Alerts',
};

export function AdminHeader() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageLabel = ADMIN_ROUTE_MAP[location.pathname] ?? 'Dashboard';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      signOut();
      refreshUser();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel.",
      });
      navigate("/admin-auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayName = formatUserName(user?.fullName || "Admin");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
    {/* Modern top bar: gradient left accent + breadcrumb + actions */}
    <div className="flex items-center justify-between bg-card border-b border-border px-6 py-0 h-14 shadow-sm">
      {/* Left — brand accent + breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-1 bg-gradient-to-b from-purple-500 to-pink-500 -ml-6 mr-2 flex-shrink-0" />
        <div className="flex flex-col leading-tight">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground font-medium">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">{currentPageLabel}</span>
          </nav>
          {/* Date + time */}
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full h-9 w-9 hover:bg-muted"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Admin Alert Bell */}
        <AdminAlertBell />

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2.5 px-2.5 h-10 rounded-full hover:bg-muted">
              <Avatar className="h-8 w-8 ring-2 ring-purple-200 dark:ring-purple-800">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold leading-tight">{displayName}</span>
                <span className="text-xs text-muted-foreground leading-tight">Administrator</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
            {/* Profile banner */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/50">
                  <AvatarFallback className="bg-white/20 text-white font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{displayName}</p>
                  <p className="text-xs text-purple-100 truncate max-w-[160px]">{user?.email}</p>
                  <Badge className="mt-1 bg-white/20 text-white border-0 text-xs gap-1 h-4 px-1.5">
                    <Shield className="w-2.5 h-2.5" />
                    Admin
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-1">
              <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="gap-2 rounded-md">
                <Settings className="w-4 h-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-1" />
              
              <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="gap-2 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-500" />
            Sign Out of Admin Panel
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Are you sure you want to sign out? You will need to log in again to access the admin panel.
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
    </>
  );
}
