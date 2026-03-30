import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { BookOpen, Settings, LogOut, LayoutDashboard, Sun, Moon, Menu } from 'lucide-react';
import { signOut } from '@/api/auth';
import NotificationBell from '@/components/NotificationBell';

const ReferralHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    refreshUser();
    navigate('/referral-auth?mode=login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RP';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm border-b z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('/referral/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Mindsta
                </span>
                <span className="text-[10px] block text-muted-foreground leading-tight">Referral Partner Portal</span>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => navigate('/referral/dashboard')}
                className={`font-medium transition-colors ${isActive('/referral/dashboard') ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600'}`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/referral/settings')}
                className={`font-medium transition-colors ${isActive('/referral/settings') ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600'}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <NotificationBell />

              {/* Mobile hamburger — shown below md */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-purple-100 dark:hover:bg-purple-950/40"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-purple-100 dark:hover:bg-purple-950/40">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold">
                        {getInitials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold truncate">{user?.fullName || 'Partner'}</span>
                      <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/referral/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/referral/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Referral partner navigation</SheetDescription>
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-white/20 text-white font-semibold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white truncate">{user?.fullName || 'Partner'}</p>
                <p className="text-xs text-purple-200 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          {/* Nav items */}
          <div className="flex flex-col gap-1 p-3 flex-1">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Navigation</p>
            <Button
              variant="ghost"
              onClick={() => { navigate('/referral/dashboard'); setMobileMenuOpen(false); }}
              className={`w-full justify-start h-11 rounded-lg font-medium ${
                isActive('/referral/dashboard')
                  ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                  : 'hover:bg-purple-100 dark:hover:bg-purple-950/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => { navigate('/referral/settings'); setMobileMenuOpen(false); }}
              className={`w-full justify-start h-11 rounded-lg font-medium ${
                isActive('/referral/settings')
                  ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                  : 'hover:bg-purple-100 dark:hover:bg-purple-950/40'
              }`}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start h-11 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/40"
            >
              {theme === 'dark'
                ? <><Sun className="w-4 h-4 mr-3 text-yellow-400" />Light Mode</>
                : <><Moon className="w-4 h-4 mr-3 text-indigo-400" />Dark Mode</>}
            </Button>
          </div>
          {/* Logout */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              onClick={() => { setMobileMenuOpen(false); setShowLogoutDialog(true); }}
              className="w-full justify-start h-11 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500" />
              Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your referral partner account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              Yes, sign me out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sentinel div to push content below the fixed header */}
      <div aria-hidden="true" className="h-16" />
    </>
  );
};

export default ReferralHeader;
