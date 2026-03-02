import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  GraduationCap,
  BarChart3,
  FileText,
  UserPlus,
  Bell,
  Menu,
  X,
  Package,
  ChevronDown,
  ChevronRight,
  Plus,
  Award,
  BookMarked,
  Lightbulb,
  MessageSquare,
  DollarSign,
  Mail,
  TrendingUp,
  Wallet,
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser, signOut, isAdmin as checkIsAdmin } from "@/api";
import { AdminHeader } from "@/components/AdminHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentMenuExpanded, setContentMenuExpanded] = useState(false);
  const [referralMenuExpanded, setReferralMenuExpanded] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Auto-expand Content Management dropdown when on related pages
  useEffect(() => {
    const contentPages = [
      '/admin/content',
      '/admin/subjects'
    ];
    const isOnContentPage = contentPages.some(page => location.pathname.startsWith(page)) ||
                           location.search.includes('create=lesson') ||
                           location.search.includes('create=quiz');
    
    if (isOnContentPage) {
      setContentMenuExpanded(true);
    }
    
    // Auto-expand Referral Management dropdown when on related pages
    const referralPages = [
      '/admin/referrals',
      '/admin/referral-payouts'
    ];
    const isOnReferralPage = referralPages.some(page => location.pathname.startsWith(page));
    
    if (isOnReferralPage) {
      setReferralMenuExpanded(true);
    }
  }, [location.pathname, location.search]);

  const checkAdminAccess = async () => {
    try {
      console.log(' AdminLayout: Checking admin access...');
      const user = getCurrentUser();
      console.log(' AdminLayout: Current user:', user);
      
      if (!user) {
        console.log(' AdminLayout: No user found');
        toast({
          title: "Authentication Required",
          description: "Please log in to access the admin panel.",
          variant: "destructive",
        });
        navigate("/admin-auth");
        return;
      }

      // Check if user is an admin by checking the userType directly
      console.log(' AdminLayout: User type:', user.userType);
      const adminStatus = user.userType === 'admin';
      console.log(' AdminLayout: Is admin?', adminStatus);

      if (!adminStatus) {
        console.log(' AdminLayout: User is not admin');
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        signOut();
        refreshUser();
        navigate("/admin-auth");
        return;
      }

      console.log(' AdminLayout: Admin access granted');
      setIsAdmin(true);
    } catch (error) {
      console.error(" AdminLayout: Admin access check error:", error);
      navigate("/admin-auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      signOut();
      refreshUser();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingScreen message="Verifying admin access..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    // Overview Section
    {
      section: "Overview",
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          path: "/admin",
          exact: true,
        },
        {
          icon: BarChart3,
          label: "Analytics",
          path: "/admin/analytics",
        },
        {
          icon: FileText,
          label: "Reports",
          path: "/admin/reports",
        },
      ]
    },
    // Content Management Section
    {
      section: "Content",
      items: [
        {
          icon: Package,
          label: "Content Management",
          path: "/admin/content",
          hasDropdown: true,
        },
        {
          icon: GraduationCap,
          label: "Lessons & Quizzes",
          path: "/admin/lessons",
        },
        {
          icon: MessageSquare,
          label: "Q&A Management",
          path: "/admin/questions",
        },
        {
          icon: Lightbulb,
          label: "Suggestions",
          path: "/admin/suggestions",
        },
      ]
    },
    // User Management Section
    {
      section: "Users",
      items: [
        {
          icon: Users,
          label: "User Management",
          path: "/admin/users",
        },
        {
          icon: MessageSquare,
          label: "Tickets & Support",
          path: "/admin/tickets",
        },
        {
          icon: Mail,
          label: "Newsletter",
          path: "/admin/newsletter",
        },
        {
          icon: Bell,
          label: "Notifications",
          path: "/admin/notifications",
        },
        {
          icon: Trophy,
          label: "Leaderboard",
          path: "/admin/leaderboard",
        },
      ]
    },
    // Financial Section
    {
      section: "Financial",
      items: [
        {
          icon: TrendingUp,
          label: "Financial Report",
          path: "/admin/financial-report",
        },
        {
          icon: UserPlus,
          label: "Referral Program",
          path: "/admin/referrals",
          hasDropdown: true,
        },
      ]
    },
    // System Section
    {
      section: "System",
      items: [
        {
          icon: Settings,
          label: "Settings",
          path: "/admin/settings",
        },
      ]
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarCollapsed ? 'w-20' : 'w-64'} 
        bg-card border-r border-border flex flex-col transition-all duration-300
        fixed lg:relative h-full z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-foreground">Mindsta</h1>
                  <p className="text-xs text-muted-foreground">Administrative Excellence</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Button - Desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 hidden lg:flex"
              >
                <Menu className="w-4 h-4" />
              </Button>
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-3">
            {menuItems.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1">
                {/* Section Label */}
                {!sidebarCollapsed && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.section}
                    </h3>
                  </div>
                )}
                
                {/* Section Items */}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path, item.exact);
                  
                  // Special handling for Content Management with dropdown
                  if (item.path === "/admin/content") {
                    const isContentActive = isActive(item.path);
                    
                    return (
                      <div key={item.path}>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (sidebarCollapsed) {
                                navigate(item.path);
                                setMobileMenuOpen(false);
                              } else {
                                setContentMenuExpanded(!contentMenuExpanded);
                              }
                            }}
                            className={`
                              flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm font-medium transition-all w-full
                              ${isContentActive 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }
                            `}
                            title={sidebarCollapsed ? item.label : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              {!sidebarCollapsed && <span>{item.label}</span>}
                            </div>
                            {!sidebarCollapsed && (
                              contentMenuExpanded ? 
                                <ChevronDown className="w-4 h-4 flex-shrink-0" /> : 
                                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>
                          
                          {/* Dropdown items */}
                          {!sidebarCollapsed && contentMenuExpanded && (
                            <div className="ml-8 mt-1 space-y-1">
                              <Link
                                to="/admin/content?create=lesson"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.search.includes('create=lesson')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <Plus className="w-4 h-4 flex-shrink-0" />
                                <span>Create Lesson</span>
                              </Link>
                              <Link
                                to="/admin/content?create=quiz"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.search.includes('create=quiz')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <Award className="w-4 h-4 flex-shrink-0" />
                                <span>Create Quiz</span>
                              </Link>
                              <Link
                                to="/admin/subjects"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.pathname === '/admin/subjects'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <BookMarked className="w-4 h-4 flex-shrink-0" />
                                <span>Subject Management</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Special handling for Referral Program with dropdown
                  if (item.path === "/admin/referrals") {
                    const isReferralActive = isActive(item.path);
                    
                    return (
                      <div key={item.path}>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (sidebarCollapsed) {
                                navigate(item.path);
                                setMobileMenuOpen(false);
                              } else {
                                setReferralMenuExpanded(!referralMenuExpanded);
                              }
                            }}
                            className={`
                              flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm font-medium transition-all w-full
                              ${isReferralActive 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }
                            `}
                            title={sidebarCollapsed ? item.label : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              {!sidebarCollapsed && <span>{item.label}</span>}
                            </div>
                            {!sidebarCollapsed && (
                              referralMenuExpanded ? 
                                <ChevronDown className="w-4 h-4 flex-shrink-0" /> : 
                                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>
                          
                          {/* Dropdown items */}
                          {!sidebarCollapsed && referralMenuExpanded && (
                            <div className="ml-8 mt-1 space-y-1">
                              <Link
                                to="/admin/referrals"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.pathname === '/admin/referrals'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                                <span>Overview</span>
                              </Link>
                              <Link
                                to="/admin/referral-payouts"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.pathname === '/admin/referral-payouts'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <Wallet className="w-4 h-4 flex-shrink-0" />
                                <span>Payouts</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${active 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className={`w-full ${sidebarCollapsed ? 'px-2' : 'gap-2'}`}
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Desktop Admin Header - Shows admin info */}
        <div className="hidden lg:block">
          <AdminHeader />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-bold">Mindsta Admin</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 container mx-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
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
};

export default AdminLayout;
