import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser, signOut, isAdmin as checkIsAdmin } from "@/api";

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

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
      navigate("/admin-auth");
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
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin",
      exact: true,
    },
    {
      icon: Users,
      label: "User Management",
      path: "/admin/users",
    },
    {
      icon: BookOpen,
      label: "Subject Management",
      path: "/admin/subjects",
    },
    {
      icon: Package,
      label: "Content Management",
      path: "/admin/content",
    },
    {
      icon: GraduationCap,
      label: "Lessons & Quizzes",
      path: "/admin/lessons",
    },
    {
      icon: Bell,
      label: "Notifications",
      path: "/admin/notifications",
    },
    {
      icon: UserPlus,
      label: "Referral Management",
      path: "/admin/referrals",
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
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
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
              <img 
                src="/assets/icons/mindsta2.png" 
                alt="Mindsta Logo" 
                className="w-10 h-10 object-contain"
              />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-foreground">Mindsta</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
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
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
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
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                          >
                            <Plus className="w-4 h-4 flex-shrink-0" />
                            <span>Create Lesson</span>
                          </Link>
                          <Link
                            to="/admin/content?create=quiz"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                          >
                            <Award className="w-4 h-4 flex-shrink-0" />
                            <span>Create Quiz</span>
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
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className={`w-full ${sidebarCollapsed ? 'px-2' : 'gap-2'}`}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
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
            <img 
              src="/assets/icons/mindsta2.png" 
              alt="Mindsta Logo" 
              className="w-6 h-6 object-contain"
            />
            <span className="font-bold">Mindsta Admin</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="container mx-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
