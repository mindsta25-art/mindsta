import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { getSidebarCounts, SidebarCounts } from "@/api/admin";
import { AdminHeader } from "@/components/AdminHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const LOCAL_DRAFT_ID = "local-lesson-draft";
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentMenuExpanded, setContentMenuExpanded] = useState(false);
  const [referralMenuExpanded, setReferralMenuExpanded] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCreateLessonDraftDialog, setShowCreateLessonDraftDialog] = useState(false);
  const [createLessonDraftTimestamp, setCreateLessonDraftTimestamp] = useState<string | null>(null);
  const [sidebarCounts, setSidebarCounts] = useState<SidebarCounts>({
    questions: 0, suggestions: 0, tickets: 0, users: 0, referralPayouts: 0, newsletter: 0, notifications: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const handleCreateLessonClick = () => {
    try {
      const draftStr = localStorage.getItem("mindsta_lesson_draft");
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        setCreateLessonDraftTimestamp(draft.timestamp || null);
        setShowCreateLessonDraftDialog(true);
        return;
      }
    } catch {
      // Ignore localStorage errors and continue to create lesson.
    }

    navigate("/admin/create-lesson");
  };

  const continueCreateLessonDraft = () => {
    setShowCreateLessonDraftDialog(false);
    navigate(`/admin/create-lesson?edit=${LOCAL_DRAFT_ID}`);
  };

  const startNewLesson = () => {
    localStorage.removeItem("mindsta_lesson_draft");
    localStorage.removeItem("mindsta_curriculum_draft");
    setShowCreateLessonDraftDialog(false);
    toast({
      title: "Start a fresh lesson",
      description: "Your saved draft has been cleared so you can begin a new lesson.",
    });
    navigate("/admin/create-lesson");
  };

  // Fetch sidebar counts once admin is confirmed, then poll every 60s
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => getSidebarCounts().then(setSidebarCounts).catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [isAdmin]);

  // Auto-expand Content Management dropdown when on related pages
  useEffect(() => {
    const contentPages = [
      '/admin/content',
      '/admin/subjects',
      '/admin/common-entrance',
      '/admin/create-common-entrance',
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
      const user = getCurrentUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the admin panel.",
          variant: "destructive",
        });
        navigate("/admin-auth");
        return;
      }

      const adminStatus = user.userType === 'admin';

      if (!adminStatus) {
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
          icon: FileText,
          label: "Draft Lessons",
          path: "/admin/lessons",
        },
        {
          icon: BookOpen,
          label: "Lesson Management",
          path: "/admin/lesson-management",
        },
      ]
    },
    // Feedback Section
    {
      section: "Feedback",
      items: [
        {
          icon: MessageSquare,
          label: "Q&A Management",
          path: "/admin/questions",
          countKey: 'questions' as const,
        },
        {
          icon: Lightbulb,
          label: "Suggestions",
          path: "/admin/suggestions",
          countKey: 'suggestions' as const,
        },
      ]
    },
    // Students Section
    {
      section: "Students",
      items: [
        {
          icon: Users,
          label: "User Management",
          path: "/admin/users",
          countKey: 'users' as const,
        },
        {
          icon: MessageSquare,
          label: "Tickets & Support",
          path: "/admin/tickets",
          countKey: 'tickets' as const,
        },
        {
          icon: Trophy,
          label: "Leaderboard",
          path: "/admin/leaderboard",
        },
      ]
    },
    // Communication Section
    {
      section: "Communication",
      items: [
        {
          icon: Mail,
          label: "Newsletter",
          path: "/admin/newsletter",
          countKey: 'newsletter' as const,
        },
        {
          icon: Bell,
          label: "Notifications",
          path: "/admin/notifications",
          countKey: 'notifications' as const,
        },
      ]
    },
    // Financial Section
    {
      section: "Financial",
      items: [
        {
          icon: FileText,
          label: "Reports",
          path: "/admin/reports",
        },
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
          countKey: 'referralPayouts' as const,
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

  const clearCount = (key: keyof SidebarCounts) =>
    setSidebarCounts(prev => ({ ...prev, [key]: 0 }));

  return (
    <TooltipProvider>
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
        {/* Sidebar Header — gradient brand strip */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 p-4 border-b border-purple-700/40">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm shadow flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-base font-bold text-white leading-tight">Mindsta</h1>
                  <p className="text-xs text-purple-200 leading-tight">Admin Panel</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Toggle Button - Desktop only */}
              {!sidebarCollapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="h-7 w-7 hidden lg:flex text-white hover:bg-white/20"
                      aria-label="Collapse sidebar"
                    >
                      <Menu className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Collapse sidebar</TooltipContent>
                </Tooltip>
              )}
              {/* Close button for mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-white hover:bg-white/20 h-7 w-7"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Close menu</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Collapsed toggle */}
          {sidebarCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden lg:flex absolute bottom-1 right-1 h-6 w-6 text-white/70 hover:bg-white/20"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-4 px-3">
            {menuItems.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1">
                {/* Section Label */}
                {!sidebarCollapsed && (
                  <div className="px-3 pt-1 pb-1">
                    <h3 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em]">
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
                    const isContentActive = isActive(item.path) ||
                      location.pathname === '/admin/create-lesson' ||
                      location.pathname === '/admin/create-quiz' ||
                      location.pathname === '/admin/create-common-entrance' ||
                      location.pathname === '/admin/common-entrance';

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
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' 
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
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  handleCreateLessonClick();
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.pathname === '/admin/create-lesson'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <Plus className="w-4 h-4 flex-shrink-0" />
                                <span>Create Lesson</span>
                              </button>
                              <Link
                                to="/admin/create-quiz"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.pathname === '/admin/create-quiz'
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
                              <Link
                                to="/admin/common-entrance"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  location.pathname.startsWith('/admin/common-entrance') || location.pathname === '/admin/create-common-entrance'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                                <span>Common Entrance</span>
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
                                clearCount('referralPayouts');
                              } else {
                                setReferralMenuExpanded(!referralMenuExpanded);
                              }
                            }}
                            className={`
                              flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm font-medium transition-all w-full
                              ${isReferralActive 
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }
                            `}
                            title={sidebarCollapsed ? item.label : undefined}
                          >
                            {sidebarCollapsed ? (
                              <Icon className="w-5 h-5 flex-shrink-0" />
                            ) : (
                              <>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Icon className="w-5 h-5 flex-shrink-0" />
                                  <span className="flex-1">{item.label}</span>
                                </div>
                                {referralMenuExpanded ? 
                                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" /> : 
                                  <ChevronRight className="w-4 h-4 flex-shrink-0 ml-1" />
                                }
                              </>
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
                                <span className="flex-1">Payouts</span>
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
                      onClick={() => { setMobileMenuOpen(false); if (item.countKey) clearCount(item.countKey); }}
                      className={`
                        flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${active 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      {sidebarCollapsed ? (
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <>
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            className={`w-full ${sidebarCollapsed ? 'px-2 justify-center' : 'gap-2 justify-start'} text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
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
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 flex items-center justify-between h-14">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Open menu</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta Admin</span>
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

    <AlertDialog open={showCreateLessonDraftDialog} onOpenChange={setShowCreateLessonDraftDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            Resume Lesson Draft
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            A saved lesson draft was found.
            {createLessonDraftTimestamp && (
              <span className="block text-sm text-muted-foreground mt-2">
                Last saved: {new Date(createLessonDraftTimestamp).toLocaleString()}.
              </span>
            )}
            Choose whether to continue your draft or start a new lesson from scratch.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={continueCreateLessonDraft}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Continue Draft
          </AlertDialogAction>
          <AlertDialogAction
            onClick={startNewLesson}
            className="bg-slate-700 text-white hover:bg-slate-800"
          >
            Start New Lesson
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </TooltipProvider>
  );
};

export default AdminLayout;
