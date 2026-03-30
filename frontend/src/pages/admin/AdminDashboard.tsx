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
  getAllProfiles
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
      const profiles = await getAllProfiles();
      const count = profiles.filter((p: any) => p.isOnline).length;
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

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers || 0, // Dynamic count from database
      icon: Users,
      description: "All registered users",
      color: "text-blue-500",
    },
    {
      title: "Paid Students",
      value: stats.paidStudents || 0,
      icon: UserCheck,
      description: "Active subscriptions",
      color: "text-green-500",
    },
    {
      title: "Total Revenue",
      value: salesStats?.formattedTotalRevenue || (salesAnalytics?.totalRevenue ? `₦${salesAnalytics.totalRevenue.toLocaleString()}` : (stats.totalRevenue ? `₦${stats.totalRevenue.toLocaleString()}` : '₦0')),
      icon: DollarSign,
      description: `${salesStats?.totalSales || salesAnalytics?.totalTransactions || 0} transactions`,
      color: "text-emerald-500",
    },
    {
      title: "Monthly Revenue",
      value: salesStats?.formattedMonthlyRevenue || '₦0',
      icon: ShoppingCart,
      description: `${salesStats?.monthlySales || 0} sales this month`,
      color: "text-teal-500",
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals || 0,
      icon: UserPlus,
      description: "Referral partners",
      color: "text-purple-500",
    },
    {
      title: "Active Users",
      value: onlineCount,
      icon: Activity,
      description: "Currently online now",
      color: "text-cyan-500",
      onClick: () => navigate('/admin/users'),
      isLive: true,
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments || 0,
      icon: Package,
      description: "lessons purchased",
      color: "text-orange-500",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate || 0}%`,
      icon: TrendingUp,
      description: "Student to paid",
      color: "text-orange-500",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome to Mindsta's Administrative Excellence Portal. Monitor, manage, and elevate your educational platform.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start shrink-0"
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
            Refresh All
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`hover:shadow-lg transition-shadow ${
                  (stat as any).onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''
                }`}
                onClick={(stat as any).onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {stat.title}
                    {(stat as any).isLive && (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-1.5 py-0.5">
                        <Circle className="w-1.5 h-1.5 fill-green-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Activity Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0.5 -mx-1">
                  {([
                    { icon: Bell,      label: 'Send Notifications',   desc: 'Push alerts to users',           path: '/admin/notifications',    color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-900/30' },
                    { icon: Trophy,    label: 'View Leaderboard',      desc: 'Top performing students',        path: '/admin/leaderboard',      color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/30' },
                    { icon: Mail,      label: 'Newsletter',             desc: 'Manage subscribers',             path: '/admin/newsletter',       color: 'text-sky-600 dark:text-sky-400',        bg: 'bg-sky-50 dark:bg-sky-900/30' },
                    { icon: Share2,    label: 'Referral Management',   desc: 'Track referral partners',        path: '/admin/referrals',        color: 'text-green-600 dark:text-green-400',    bg: 'bg-green-50 dark:bg-green-900/30' },
                    { icon: Wallet,    label: 'Referral Payouts',      desc: 'Process pending payouts',        path: '/admin/referral-payouts', color: 'text-teal-600 dark:text-teal-400',      bg: 'bg-teal-50 dark:bg-teal-900/30' },
                    { icon: FileText,  label: 'Generate Report',       desc: 'Export system data',             path: '/admin/reports',          color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-900/30' },
                    { icon: Users,     label: 'Manage Users',          desc: 'View and edit user accounts',    path: '/admin/users',            color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
                  ] as { icon: LucideIcon; label: string; desc: string; path: string; color: string; bg: string }[]).map(({ icon: Icon, label, desc, path, color, bg }) => (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group text-left"
                    >
                      <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center flex-shrink-0 transition-colors`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current system health and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {(['Database', 'API Server', 'Storage', 'Authentication'] as const).map((service) => (
                    <div key={service} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Operational
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sales Statistics Card */}
            {salesStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    Sales Statistics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive sales performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">{salesStats.totalSales.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Items Sold</p>
                      <p className="text-2xl font-bold">{salesStats.totalItems.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Average Order Value</p>
                      <p className="text-2xl font-bold">₦{typeof salesStats.averageOrderValue === 'number' ? salesStats.averageOrderValue.toLocaleString() : salesStats.averageOrderValue}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Monthly Sales</p>
                      <p className="text-2xl font-bold text-green-500">{salesStats.monthlySales.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-green-500">{salesStats.formattedMonthlyRevenue}</p>
                    </div>
                    {salesStats.lastSaleDate && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Last Sale</p>
                        <p className="text-lg font-semibold">{new Date(salesStats.lastSaleDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Recent Course Purchases
                </CardTitle>
                <CardDescription>
                  Latest enrollment purchases in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentPurchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent purchases yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPurchases.map((purchase: any, index: number) => (
                      <div key={purchase.id || index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="p-2 rounded bg-green-500/10">
                          <ShoppingCart className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{formatUserName(purchase.userName)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {purchase.subject} - Grade {purchase.grade} {purchase.term && `• ${purchase.term}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-green-600">₦{purchase.price?.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(purchase.purchasedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analyticsLoading && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-muted-foreground">Loading analytics data...</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analyticsError && !analyticsLoading && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-200">Analytics Error</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{analyticsError}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={fetchAnalyticsData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!analyticsLoading && (
              <>
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  User Growth (Last 30 Days)
                </CardTitle>
                <CardDescription>
                  Daily new user registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowthData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>No user growth data available</p>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      formatter={(value: number) => [`${value} users`, 'New Users']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#667eea" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCount)"
                      animationDuration={1500}
                      dot={{ r: 4, fill: '#667eea', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                  <CardDescription>
                    Daily revenue and cumulative total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        name="Daily Revenue"
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeRevenue" 
                        stroke="#667eea" 
                        strokeWidth={3} 
                        name="Total Revenue"
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#667eea', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Signups</CardTitle>
                  <CardDescription>
                    New referrals over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={referralData?.signups || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        formatter={(value: number) => [`${value} signups`, 'Referrals']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'rgba(118, 75, 162, 0.1)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#764ba2" 
                        radius={[8, 8, 0, 0]}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Pie Charts */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>User Types</CardTitle>
                  <CardDescription>
                    Distribution by user type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={userTypesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count, percent }) => `${type}: ${count} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {userTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} users`, '']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                  <CardDescription>
                    Payments by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name, props) => [`${value} (₦${props.payload.amount.toLocaleString()})`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>
                    Students by grade level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="grade" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="circle"
                      />
                      <Bar 
                        dataKey="paid" 
                        stackId="a" 
                        fill="#10b981" 
                        name="Paid" 
                        radius={[8, 8, 0, 0]}
                        animationDuration={1500}
                      />
                      <Bar 
                        dataKey="unpaid" 
                        stackId="a" 
                        fill="#ef4444" 
                        name="Unpaid"
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Referral Performance Summary */}
            {referralData && (
              <Card>
                <CardHeader>
                  <CardTitle>Referral Program Performance</CardTitle>
                  <CardDescription>
                    Key metrics for the referral program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                      <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Completed Referrals</p>
                      <p className="text-2xl font-bold text-green-500">{referralData.completedReferrals}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold text-blue-500">{referralData.conversionRate}%</p>
                    </div>
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
