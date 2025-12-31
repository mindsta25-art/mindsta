import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  FileJson,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  generateStudentProgressReport,
  generateLessonAnalyticsReport,
  generateEngagementSummaryReport,
  generateGradePerformanceReport,
  generateUserActivityReport,
  generateContentInventoryReport,
  downloadReport,
  type StudentProgressReport,
  type LessonAnalyticsReport,
  type EngagementSummaryReport,
  type GradePerformanceReport,
  type UserActivityReport,
  type ContentInventoryReport,
} from "@/api";

interface Report {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: string;
  generator: (params: any) => Promise<any>;
}

const Reports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedFormat, setSelectedFormat] = useState("json");
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const reports: Report[] = [
    {
      id: "student-progress",
      title: "Student Progress Report",
      description: "Detailed progress tracking for all students including completed lessons, quiz scores, and engagement metrics",
      icon: Users,
      type: "progress",
      generator: generateStudentProgressReport,
    },
    {
      id: "lesson-analytics",
      title: "Lesson Analytics Report",
      description: "Comprehensive analysis of lesson performance, completion rates, and student feedback",
      icon: BookOpen,
      type: "analytics",
      generator: generateLessonAnalyticsReport,
    },
    {
      id: "engagement-summary",
      title: "Engagement Summary",
      description: "Overview of user activity, active sessions, time spent, and interaction patterns",
      icon: TrendingUp,
      type: "engagement",
      generator: generateEngagementSummaryReport,
    },
    {
      id: "grade-performance",
      title: "Grade Performance Report",
      description: "Grade-by-grade analysis showing average scores, completion rates, and subject performance",
      icon: BarChart3,
      type: "performance",
      generator: generateGradePerformanceReport,
    },
    {
      id: "user-activity",
      title: "User Activity Log",
      description: "Detailed log of user logins, actions performed, and system interactions",
      icon: Calendar,
      type: "activity",
      generator: generateUserActivityReport,
    },
    {
      id: "content-inventory",
      title: "Content Inventory",
      description: "Complete list of all lessons, quizzes, and educational materials with metadata",
      icon: FileText,
      type: "inventory",
      generator: generateContentInventoryReport,
    },
  ];

  const handleGenerateReport = async (report: Report) => {
    try {
      setGenerating(report.id);
      
      const params = {
        period: selectedPeriod,
        format: selectedFormat,
      };
      
      const result = await report.generator(params);
      
      if (selectedFormat === 'csv') {
        // Download CSV file
        const blob = result as Blob;
        downloadReport(blob, `${report.id}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
        
        toast({
          title: "✅ Report Downloaded",
          description: `${report.title} has been downloaded as CSV.`,
        });
      } else {
        // Show JSON report in dialog
        setViewingReport({
          ...result,
          reportTitle: report.title,
        });
        setReportDialogOpen(true);
        
        toast({
          title: "✅ Report Generated",
          description: "Your report has been generated successfully.",
        });
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleQuickReport = async (period: 'today' | 'week' | 'month', format: 'json' | 'csv' = 'json') => {
    try {
      setGenerating('quick-report');
      
      const result = await generateEngagementSummaryReport({ period, format });
      
      if (format === 'csv') {
        const blob = result as Blob;
        downloadReport(blob, `quick-engagement-${period}-${new Date().toISOString().split('T')[0]}.csv`);
        
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded.`,
        });
      } else {
        setViewingReport({
          ...result,
          reportTitle: `${period.charAt(0).toUpperCase() + period.slice(1)} Engagement Summary`,
        });
        setReportDialogOpen(true);
        
        toast({
          title: "✅ Quick Report Ready",
          description: `${period.charAt(0).toUpperCase() + period.slice(1)} report generated.`,
        });
      }
    } catch (error: any) {
      console.error("Error generating quick report:", error);
      toast({
        title: "❌ Error",
        description: "Failed to generate quick report.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const quickReports: Array<{ label: string; period: 'today' | 'week' | 'month'; icon: any }> = [
    { label: "Today's Activity", period: "today", icon: Calendar },
    { label: "Weekly Summary", period: "week", icon: TrendingUp },
    { label: "Monthly Overview", period: "month", icon: BarChart3 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-muted-foreground mt-2">
            Generate detailed reports and export data
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          {quickReports.map((quickReport) => {
            const Icon = quickReport.icon;
            return (
              <Card 
                key={quickReport.label} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleQuickReport(quickReport.period)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{quickReport.label}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickReport(quickReport.period, 'csv');
                      }}
                    >
                      <Download className="w-3 h-3" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure report parameters before generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period">Time Period</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        PDF Document
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel Spreadsheet
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV File
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4" />
                        JSON Data
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Available Reports</h2>
          
          <div className="grid gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              const isGenerating = generating === report.id;
              
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {report.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedFormat === 'json' && (
                          <Button 
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleGenerateReport(report)}
                            disabled={isGenerating}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        )}
                        <Button 
                          className="gap-2"
                          onClick={() => handleGenerateReport(report)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              {selectedFormat === 'csv' ? 'Download' : 'Generate'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Previously generated reports available for download
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Student Progress - November 2025", date: "2025-11-10", size: "2.4 MB", format: "PDF" },
                { name: "Lesson Analytics - October 2025", date: "2025-11-01", size: "1.8 MB", format: "Excel" },
                { name: "Engagement Summary - Q3 2025", date: "2025-10-15", size: "3.1 MB", format: "PDF" },
              ].map((report, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.date} • {report.size} • {report.format}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-blue-500/20">
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Dynamic Reporting</p>
                <p className="text-xs text-muted-foreground">
                  All reports are generated in real-time from your database.
                  Select JSON format to view the report data instantly, or choose CSV for downloads.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Viewer Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewingReport?.reportTitle || 'Report Data'}
            </DialogTitle>
            <DialogDescription>
              Generated: {viewingReport?.generatedAt ? new Date(viewingReport.generatedAt).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            {viewingReport && (
              <div className="space-y-6">
                {/* Summary Section */}
                {viewingReport.summary && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Summary
                    </h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(viewingReport.summary).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <p className="text-xs text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-lg font-bold">
                                {typeof value === 'number' && !key.toLowerCase().includes('rate') && !key.toLowerCase().includes('score')
                                  ? value.toLocaleString()
                                  : String(value)}
                                {(key.toLowerCase().includes('rate') || key.toLowerCase().includes('score')) && typeof value === 'number' ? '%' : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Data Section */}
                {viewingReport.data && Array.isArray(viewingReport.data) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        Detailed Data ({viewingReport.data.length} records)
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const dataStr = JSON.stringify(viewingReport.data, null, 2);
                          const blob = new Blob([dataStr], { type: 'application/json' });
                          downloadReport(blob, `${viewingReport.type}-data-${new Date().toISOString().split('T')[0]}.json`);
                          toast({
                            title: "✅ Data Downloaded",
                            description: "Report data exported as JSON.",
                          });
                        }}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download JSON
                      </Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <ScrollArea className="h-[300px]">
                        <div className="p-4 bg-muted/30 font-mono text-xs">
                          <pre>{JSON.stringify(viewingReport.data.slice(0, 50), null, 2)}</pre>
                          {viewingReport.data.length > 50 && (
                            <p className="text-muted-foreground mt-2">
                              ... and {viewingReport.data.length - 50} more records
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {/* Additional Sections */}
                {viewingReport.userTypeBreakdown && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">User Type Breakdown</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(viewingReport.userTypeBreakdown).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <span className="capitalize">{type}</span>
                              <Badge>{count as number}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {viewingReport.activityByDay && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">Activity by Day</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          {Object.entries(viewingReport.activityByDay).map(([day, count]) => (
                            <div key={day} className="flex items-center justify-between">
                              <span>{day}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full"
                                    style={{ 
                                      width: `${Math.min(100, ((count as number) / Math.max(...Object.values(viewingReport.activityByDay) as number[])) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-mono w-12 text-right">{count as number}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Reports;
