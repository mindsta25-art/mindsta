import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { formatUserName } from "@/lib/stringUtils";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  UserPlus,
  Activity,
  DollarSign,
  UserCheck,
  BarChart3,
  ShoppingCart,
  Package,
  RefreshCw,
  AlertCircle,
  Circle,
  Bell,
  Trophy,
  Mail,
  Share2,
  Wallet,
  FileText,
  ChevronRight,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading";
import { 
  getDashboardStats, 
  getOverviewStats, 
  getRecentPurchases,
  getUserGrowth,
  getRevenueOverTime,
  getReferralPerformance,
  getUserTypes,
  getPaymentStatusDistribution,
  getStudentGrades,
  getOnlineCount
} from "@/api";
import { getSalesAnalytics, SalesAnalytics } from "@/api/payments";
import { getSalesStats, SalesStats } from "@/api/admin";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalLessons: number;
  activeUsers: number;
  completionRate: number;
  totalEducators?: number;
  totalParents?: number;
  totalUsers?: number;
  paidStudents?: number;
  totalReferrals?: number;
  totalRevenue?: number;
  totalCommissions?: number;
  conversionRate?: number;
  totalEnrollments?: number;
}

interface ChartDataPoint {
  date: string;
  count?: number;
  revenue?: number;
  cumulativeRevenue?: number;
  commission?: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalLessons: 0,
    activeUsers: 0,
    completionRate: 0,
  });
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [referralData, setReferralData] = useState<any>(null);
  const [userTypesData, setUserTypesData] = useState<any[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

  const fetchOnlineCount = async () => {
    try {
      const { count } = await getOnlineCount();
      setOnlineCount(count);
    } catch (error) {
      console.error('Error fetching online count:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchAnalyticsData();
    fetchRecentPurchases();
    fetchSalesAnalytics();
    fetchSalesStats();
    fetchOnlineCount();

    // Refresh online count every 15 seconds
    const onlineInterval = setInterval(fetchOnlineCount, 15000);
    return () => clearInterval(onlineInterval);
  }, []);

  const fetchSalesStats = async () => {
    try {
      const data = await getSalesStats();
      setSalesStats(data);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    }
  };

  const fetchSalesAnalytics = async () => {
    try {
      const data = await getSalesAnalytics();
      setSalesAnalytics(data);
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
    }
  };

  const fetchRecentPurchases = async () => {
    try {
      const purchases = await getRecentPurchases(10);
      setRecentPurchases(purchases || []);
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch both legacy and new analytics
      const [dashboardStats, overviewStats] = await Promise.all([
        getDashboardStats(),
        getOverviewStats()
      ]);
      
      // Prioritize dynamic database counts from analytics/overview
      setStats({
        totalStudents: overviewStats?.totalStudents || (dashboardStats as any).totalStudents || 0,
        totalLessons: (dashboardStats as any).totalLessons || 0,
        activeUsers: overviewStats?.activeUsers || (dashboardStats as any).activeUsers || 0,
        completionRate: (dashboardStats as any).completionRate || 0,
        totalEducators: (dashboardStats as any).totalEducators,
        totalParents: (dashboardStats as any).totalParents,
        totalUsers: overviewStats?.totalUsers || 0, // Dynamic count from database
        paidStudents: overviewStats?.paidStudents || 0,
        totalReferrals: overviewStats?.totalReferrals || 0,
        totalRevenue: overviewStats?.totalRevenue || 0,
        totalCommissions: overviewStats?.totalCommissions || 0,
        conversionRate: overviewStats?.conversionRate || (dashboardStats as any).completionRate || 0,
        totalEnrollments: overviewStats?.totalEnrollments || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    
    try {
      const [userGrowth, revenue, referralPerf, userTypes, paymentStatus, grades] = await Promise.all([
        getUserGrowth(30),
        getRevenueOverTime(30),
        getReferralPerformance(30),
        getUserTypes(),
        getPaymentStatusDistribution(),
        getStudentGrades()
      ]);

      setUserGrowthData(userGrowth);
      setRevenueData(revenue);
      setReferralData(referralPerf);
      setUserTypesData(userTypes);
      setPaymentStatusData(paymentStatus);
      setGradeDistribution(grades);
      
      console.log('[Analytics] Data loaded successfully:', {
        userGrowth: userGrowth.length,
        revenue: revenue.length,
        referralPerf: referralPerf ? 'loaded' : 'null',
        userTypes: userTypes.length,
        paymentStatus: paymentStatus.length,
        grades: grades.length
      });
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      setAnalyticsError(error.message || 'Failed to load analytics data');
      toast({
        title: "Analytics Error",
        description: "Some analytics data could not be loaded. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading admin dashboard..." />;
  }

  /** Maps each stat to a gradient + icon color for the modern card design */
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      icon: Users,
      description: "All registered users",
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Paid Students",
      value: stats.paidStudents || 0,
      icon: UserCheck,
      description: "Active subscriptions",
      gradient: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Revenue",
      value: salesStats?.formattedTotalRevenue || (salesAnalytics?.totalRevenue ? `₦${salesAnalytics.totalRevenue.toLocaleString()}` : (stats.totalRevenue ? `₦${stats.totalRevenue.toLocaleString()}` : '₦0')),
      icon: DollarSign,
      description: `${salesStats?.totalSales || salesAnalytics?.totalTransactions || 0} transactions`,
      gradient: "from-teal-500 to-cyan-600",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Monthly Revenue",
      value: salesStats?.formattedMonthlyRevenue || '₦0',
      icon: ShoppingCart,
      description: `${salesStats?.monthlySales || 0} sales this month`,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals || 0,
      icon: UserPlus,
      description: "Referral partners",
      gradient: "from-pink-500 to-rose-600",
      bg: "bg-pink-50 dark:bg-pink-950/30",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Active Now",
      value: onlineCount,
      icon: Activity,
      description: "Users online now",
      gradient: "from-cyan-500 to-sky-600",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      isLive: true,
      onClick: () => navigate('/admin/users'),
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments || 0,
      icon: Package,
      description: "Lessons purchased",
      gradient: "from-orange-500 to-amber-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate || 0}%`,
      icon: TrendingUp,
      description: "Student to paid",
      gradient: "from-indigo-500 to-blue-600",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  const quickActions = [
    { icon: Bell,     label: 'Notifications',    desc: 'Push alerts',             path: '/admin/notifications',    color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { icon: Trophy,   label: 'Leaderboard',       desc: 'Top students',            path: '/admin/leaderboard',      color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { icon: Mail,     label: 'Newsletter',         desc: 'Manage subscribers',      path: '/admin/newsletter',       color: 'text-sky-600 dark:text-sky-400',        bg: 'bg-sky-50 dark:bg-sky-900/30' },
    { icon: Share2,   label: 'Referrals',          desc: 'Track partners',          path: '/admin/referrals',        color: 'text-green-600 dark:text-green-400',    bg: 'bg-green-50 dark:bg-green-900/30' },
    { icon: Wallet,   label: 'Payouts',            desc: 'Process payouts',         path: '/admin/referral-payouts', color: 'text-teal-600 dark:text-teal-400',      bg: 'bg-teal-50 dark:bg-teal-900/30' },
    { icon: FileText, label: 'Reports',            desc: 'Export data',             path: '/admin/reports',          color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-900/30' },
    { icon: Users,    label: 'Users',              desc: 'Manage accounts',         path: '/admin/users',            color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { icon: BookOpen, label: 'Lessons',            desc: 'Manage content',          path: '/admin/lesson-management',color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-50 dark:bg-blue-900/30' },
  ] as { icon: LucideIcon; label: string; desc: string; path: string; color: string; bg: string }[];

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor, manage, and grow the Mindsta learning platform.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start shrink-0 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            onClick={() => {
              fetchDashboardStats();
              fetchAnalyticsData();
              fetchRecentPurchases();
              fetchSalesAnalytics();
              fetchSalesStats();
              fetchOnlineCount();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 ${
                  (stat as any).onClick ? 'cursor-pointer' : ''
                }`}
                onClick={(stat as any).onClick}
              >
                {/* Gradient top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${stat.bg} flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                    {(stat as any).isLive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-1.5 py-0.5">
                        <Circle className="w-1.5 h-1.5 fill-green-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold tabular-nums leading-none mb-1">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground leading-tight">{stat.title}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Activity Tabs ── */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/60 p-1 gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Recent Purchases</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Analytics</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">

              {/* Quick Actions Grid */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <CardDescription>Jump to common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map(({ icon: Icon, label, desc, path, color, bg }) => (
                      <button
                        key={path}
                        onClick={() => navigate(path)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-border hover:bg-muted/50 transition-all duration-150 text-left group"
                      >
                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight truncate">{label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Status + Sales Summary */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    {(['Database', 'API Server', 'File Storage', 'Authentication'] as const).map((service) => (
                      <div key={service} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{service}</span>
                        </div>
                        <span className="text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5">
                          Operational
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {salesStats && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Sales Snapshot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Sales',   value: salesStats.totalSales.toLocaleString() },
                          { label: 'Items Sold',    value: salesStats.totalItems.toLocaleString() },
                          { label: 'Avg. Order',    value: `₦${Number(salesStats.averageOrderValue).toLocaleString()}` },
                          { label: 'Monthly',       value: salesStats.formattedMonthlyRevenue, highlight: true },
                        ].map(({ label, value, highlight }) => (
                          <div key={label} className="bg-muted/40 rounded-lg p-3">
                            <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                            <p className={`text-sm font-bold mt-0.5 ${highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Recent Purchases Tab ── */}
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                  Recent Lesson Purchases
                </CardTitle>
                <CardDescription>Latest lesson purchases in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPurchases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No recent purchases yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPurchases.map((purchase: any, index: number) => (
                      <div key={purchase.id || index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                          <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{formatUserName(purchase.userName)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {purchase.subject} · Grade {purchase.grade}{purchase.term ? ` · ${purchase.term}` : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₦{purchase.price?.toLocaleString()}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(purchase.purchasedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="space-y-4">
            {analyticsLoading && (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading analytics…</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analyticsError && !analyticsLoading && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-200">Analytics Error</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{analyticsError}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={fetchAnalyticsData}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Retry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!analyticsLoading && (
              <>
                {/* User Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      User Growth — Last 30 Days
                    </CardTitle>
                    <CardDescription>Daily new user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userGrowthData.length === 0 ? (
                      <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={userGrowthData}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} formatter={(v: number) => [`${v} users`, 'New Users']} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" dot={{ r: 3, fill: '#667eea', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} animationDuration={1200} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Revenue + Referrals side by side */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Revenue Over Time</CardTitle>
                      <CardDescription>Daily + cumulative revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} formatter={(v: number) => [`₦${v.toLocaleString()}`, '']} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                          <Legend iconType="line" wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Daily" dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={1200} />
                          <Line type="monotone" dataKey="cumulativeRevenue" stroke="#667eea" strokeWidth={2} strokeDasharray="5 5" name="Cumulative" dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={1200} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Referral Signups</CardTitle>
                      <CardDescription>New referrals per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={referralData?.signups || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} formatter={(v: number) => [`${v}`, 'Signups']} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: 'rgba(118,75,162,0.08)' }} />
                          <Bar dataKey="count" fill="#764ba2" radius={[6, 6, 0, 0]} animationDuration={1200} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Distribution charts */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">User Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={userTypesData} cx="50%" cy="50%" labelLine={false} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} outerRadius={75} dataKey="count" nameKey="type" animationBegin={0} animationDuration={1200}>
                            {userTypesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`${v} users`, '']} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={paymentStatusData} cx="50%" cy="50%" labelLine={false} label={({ status, count }) => `${status}: ${count}`} outerRadius={75} dataKey="count" nameKey="status">
                            {paymentStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number, _n, props) => [`${v} (₦${props.payload.amount?.toLocaleString() ?? 0})`, '']} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Grade Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={gradeDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                          <XAxis dataKey="grade" stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                          <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" radius={[6, 6, 0, 0]} animationDuration={1200} />
                          <Bar dataKey="unpaid" stackId="a" fill="#f87171" name="Unpaid" animationDuration={1200} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Referral Performance */}
                {referralData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-green-500" />
                        Referral Program Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Total Referrals',    value: referralData.totalReferrals,    color: '' },
                          { label: 'Completed',          value: referralData.completedReferrals, color: 'text-emerald-600 dark:text-emerald-400' },
                          { label: 'Conversion Rate',    value: `${referralData.conversionRate}%`, color: 'text-blue-600 dark:text-blue-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-muted/40 rounded-xl p-4 text-center">
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
