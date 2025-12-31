import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDetailedAnalytics, exportAnalytics, type DetailedAnalytics } from '@/api/analytics';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, TrendingUp, Users, BookOpen, Award, Clock } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { LoadingScreen } from '@/components/ui/loading';

const Analytics = () => {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('30');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

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
          
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time / Lesson</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.avgTimePerLesson} min</div>
            <p className="text-xs text-muted-foreground mt-1">Average session duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Lessons completed</p>
            <Progress value={analytics.engagementMetrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Accuracy</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.quizAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
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
      </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
