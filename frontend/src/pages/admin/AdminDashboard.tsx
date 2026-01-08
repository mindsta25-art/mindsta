import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
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
  Package
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading";
import { getDashboardStats, getOverviewStats, getRecentPurchases } from "@/api";\nimport { getSalesAnalytics, SalesAnalytics } from "@/api/payments";
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

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

  useEffect(() => {
    fetchDashboardStats();
    fetchAnalyticsData();
    fetchRecentPurchases();
    fetchSalesAnalytics();
  }, []);

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
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [userGrowth, revenue, referralPerf, userTypes, paymentStatus, grades] = await Promise.all([
        fetch('/api/analytics/user-growth?days=30', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/analytics/revenue-over-time?days=30', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/analytics/referral-performance?days=30', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/analytics/user-types', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/analytics/payment-status', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/analytics/student-grades', { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      setUserGrowthData(userGrowth);
      setRevenueData(revenue);
      setReferralData(referralPerf);
      setUserTypesData(userTypes);
      setPaymentStatusData(paymentStatus);
      setGradeDistribution(grades);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
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
      value: salesAnalytics?.totalRevenue ? `₦${salesAnalytics.totalRevenue.toLocaleString()}` : (stats.totalRevenue ? `₦${stats.totalRevenue.toLocaleString()}` : '₦0'),
      icon: DollarSign,
      description: `${salesAnalytics?.totalTransactions || 0} transactions`,
      color: "text-emerald-500",
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
      value: stats.activeUsers || 0,
      icon: Activity,
      description: "Users this week",
      color: "text-cyan-500",
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments || 0,
      icon: Package,
      description: "Courses purchased",
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the Mindsta admin panel. Monitor and manage your educational platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
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
                <CardContent className="space-y-2">
                  <button onClick={() => navigate('/admin/notifications')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                    Send Notifications
                  </button>
                  <button onClick={() => navigate('/admin/referrals')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                    Referral Management
                  </button>
                  <button onClick={() => navigate('/admin/referral-payouts')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                    Referral Payouts
                  </button>
                  <button onClick={() => navigate('/admin/reports')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                    Generate Report
                  </button>
                  <button onClick={() => navigate('/admin/users')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                    Manage Users
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current system health and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <span className="text-sm font-medium text-green-500">●  Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Server</span>
                    <span className="text-sm font-medium text-green-500">●  Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Storage</span>
                    <span className="text-sm font-medium text-green-500">●  Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <span className="text-sm font-medium text-green-500">●  Operational</span>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                          <p className="text-sm font-medium truncate">{purchase.userName}</p>
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
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number) => [`${value} users`, 'New Users']}
                    />
                    <Area type="monotone" dataKey="count" stroke="#667eea" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Daily Revenue" />
                      <Line type="monotone" dataKey="cumulativeRevenue" stroke="#667eea" strokeWidth={2} name="Total Revenue" />
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value: number) => [`${value} signups`, 'Referrals']}
                      />
                      <Bar dataKey="count" fill="#764ba2" />
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
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                      >
                        {userTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                      <Bar dataKey="unpaid" stackId="a" fill="#ef4444" name="Unpaid" />
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
