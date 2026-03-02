import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut,
  Shield,
  Moon,
  Sun,
  Mail,
  Clock
} from "lucide-react";
import { signOut } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatUserName } from "@/lib/stringUtils";
import { AdminAlertBell } from "@/components/AdminAlertBell";

export function AdminHeader() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
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
    <div className="flex items-center justify-between bg-card border-b border-border px-6 py-3">
      <div className="flex items-center gap-3">
        <Badge className="bg-blue-500 text-white gap-1">
          <Clock className="w-3 h-3" />
          {currentTime.toLocaleTimeString()}
        </Badge>
        <Badge variant="outline" className="gap-1">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Admin Alert Bell */}
        <AdminAlertBell />

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{displayName}</span>
                <Badge className="bg-red-500 text-white text-xs gap-1 h-4 px-1">
                  <Shield className="w-2.5 h-2.5" />
                  Admin
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="px-2 py-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{displayName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-red-500" />
                <Badge className="bg-red-500 text-white">Administrator</Badge>
              </div>
            </div>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
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
