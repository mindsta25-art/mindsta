import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDetailedAnalytics, exportAnalytics, type DetailedAnalytics, getAdminStudentStudyTime, type StudentStudyTime } from '@/api/analytics';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, TrendingUp, Users, BookOpen, Award, Clock } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { LoadingScreen } from '@/components/ui/loading';

const Analytics = () => {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<string>('30');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [studyTimeData, setStudyTimeData] = useState<StudentStudyTime[]>([]);
  const [studyTimeLoading, setStudyTimeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const data = await getDetailedAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (data) {
        setAnalytics(data);
      } else {
        // Set default empty data if API returns null
        setAnalytics({
          gradeDistribution: [],
          userGrowth: [],
          lessonCompletions: [],
          engagementMetrics: {
            avgTimePerLesson: 0,
            completionRate: 0,
            quizAccuracy: 0,
            activeUsers: 0,
            peakActivityHour: 0,
            totalSessions: 0,
          },
          activityPatterns: {
            dailyActive: 0,
            weeklyActive: 0,
            monthlyActive: 0,
            avgSessionDuration: 0,
            retentionRate: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Using default values.',
        variant: 'destructive',
      });
      // Set default empty data on error
      setAnalytics({
        gradeDistribution: [],
        userGrowth: [],
        lessonCompletions: [],
        engagementMetrics: {
          avgTimePerLesson: 0,
          completionRate: 0,
          quizAccuracy: 0,
          activeUsers: 0,
          peakActivityHour: 0,
          totalSessions: 0,
        },
        activityPatterns: {
          dailyActive: 0,
          weeklyActive: 0,
          monthlyActive: 0,
          avgSessionDuration: 0,
          retentionRate: 0,
        },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, dateRange]);

  const fetchStudyTime = async () => {
    setStudyTimeLoading(true);
    try {
      const data = await getAdminStudentStudyTime();
      setStudyTimeData(data);
    } catch (error) {
      console.error('Error fetching study time:', error);
    } finally {
      setStudyTimeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'studytime') {
      fetchStudyTime();
    }
  }, [activeTab]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await exportAnalytics(format, 'all');
      
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Success',
        description: `Analytics exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export analytics',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading analytics dashboard..." />;
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground">No analytics data available</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const maxStudents = Math.max(...analytics.gradeDistribution.map(d => d.students), 1);
  const maxCompletions = Math.max(...analytics.lessonCompletions.map(l => l.completions), 1);
  const maxUsers = Math.max(...analytics.userGrowth.map(u => u.users), 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time platform insights and metrics</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all">{analytics.engagementMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Last {dateRange} days</p>
            {refreshing && <div className="text-xs text-blue-600 mt-1">Updating...</div>}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time / Lesson</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all">{analytics.engagementMetrics.avgTimePerLesson} min</div>
            <p className="text-xs text-muted-foreground mt-1">Average session duration</p>
            {refreshing && <div className="text-xs text-blue-600 mt-1">Updating...</div>}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all">{analytics.engagementMetrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Lessons completed</p>
            <Progress value={analytics.engagementMetrics.completionRate} className="mt-2 transition-all" />
            {refreshing && <div className="text-xs text-blue-600 mt-1">Updating...</div>}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Accuracy</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all">{analytics.engagementMetrics.quizAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average score</p>
            <Progress value={analytics.engagementMetrics.quizAccuracy} className="mt-2 transition-all" />
            {refreshing && <div className="text-xs text-blue-600 mt-1">Updating...</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="studytime">Study Time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>New registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.userGrowth.map((item) => (
                    <div key={`${item.month}-${item.year}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.month} {item.year}</span>
                        <span className="text-sm text-muted-foreground">{item.users} users</span>
                      </div>
                      <Progress value={(item.users / maxUsers) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Grade</CardTitle>
                <CardDescription>Current enrollment across grades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.gradeDistribution.map((item) => (
                    <div key={item.grade}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Grade {item.grade}</span>
                        <Badge variant="secondary">{item.students} students</Badge>
                      </div>
                      <Progress value={(item.students / maxStudents) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Patterns</CardTitle>
              <CardDescription>User engagement breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Daily Active</span>
                    <span className="font-bold">{analytics.activityPatterns.dailyActive}</span>
                  </div>
                  <Progress value={(analytics.activityPatterns.dailyActive / analytics.engagementMetrics.activeUsers) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Weekly Active</span>
                    <span className="font-bold">{analytics.activityPatterns.weeklyActive}</span>
                  </div>
                  <Progress value={(analytics.activityPatterns.weeklyActive / analytics.engagementMetrics.activeUsers) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Monthly Active</span>
                    <span className="font-bold">{analytics.activityPatterns.monthlyActive}</span>
                  </div>
                  <Progress value={(analytics.activityPatterns.monthlyActive / analytics.engagementMetrics.activeUsers) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Lessons</CardTitle>
              <CardDescription>Most completed lessons by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.lessonCompletions.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.subject}</span>
                      <Badge variant="outline">{item.completions} completions</Badge>
                    </div>
                    <Progress value={(item.completions / maxCompletions) * 100} />
                  </div>
                ))}
                {analytics.lessonCompletions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No lesson completion data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="studytime" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Study Time</CardTitle>
                <CardDescription>Time each student has spent on lessons (recorded in real-time)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchStudyTime} disabled={studyTimeLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${studyTimeLoading ? 'animate-spin' : ''}`} />
                {studyTimeLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {studyTimeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : studyTimeData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No study time data recorded yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">#</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Today</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">This Week</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">All Time</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studyTimeData.map((student, idx) => (
                        <tr key={student.userId} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-3 px-2 font-medium">{student.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{student.email}</td>
                          <td className="py-3 px-2 text-right">
                            {student.todayMinutes > 0 ? (
                              <Badge variant="secondary">{student.todayMinutes} min</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className={student.weeklyMinutes > 0 ? 'font-semibold text-blue-600' : 'text-muted-foreground'}>
                              {student.weeklyMinutes > 0 ? `${student.weeklyMinutes} min` : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className={student.totalMinutes >= 60 ? 'font-bold text-green-600' : student.totalMinutes > 0 ? 'font-semibold' : 'text-muted-foreground'}>
                              {student.totalMinutes >= 60
                                ? `${Math.floor(student.totalMinutes / 60)}h ${student.totalMinutes % 60}m`
                                : student.totalMinutes > 0 ? `${student.totalMinutes} min` : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground text-xs">
                            {student.lastStudyDate
                              ? new Date(student.lastStudyDate).toLocaleDateString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
