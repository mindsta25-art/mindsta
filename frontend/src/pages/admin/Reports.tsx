import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
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
  DollarSign,
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
import { generatePurchasesReport } from "@/api/payments";
import {
  generatePDFReport,
  generatePDFPreview,
  generateCSVReport,
  generateJSONReport,
  generateExcelReport
} from "@/utils/reportGenerator";

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
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [selectedOrientation, setSelectedOrientation] = useState<"portrait" | "landscape">("portrait");
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // Load recent reports from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mindsta_recent_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentReports(parsed || []);
      } catch (err) {
        console.error('Error loading recent reports:', err);
      }
    }
  }, []);

  // Save report to recent reports
  const saveReportToHistory = (reportInfo: {
    name: string;
    format: string;
    period: string;
    size?: string;
  }) => {
    const newReport = {
      ...reportInfo,
      date: new Date().toISOString(),
      id: Date.now().toString()
    };

    const updated = [newReport, ...recentReports].slice(0, 10); // Keep only last 10
    setRecentReports(updated);
    localStorage.setItem('mindsta_recent_reports', JSON.stringify(updated));
  };

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
    {
      id: "purchases-report",
      title: "Purchases Report",
      description: "Comprehensive report of all purchases, transactions, revenue, and payment details",
      icon: DollarSign,
      type: "purchases",
      generator: generatePurchasesReport,
    },
  ];

  const handlePreviewReport = async (report: Report) => {
    try {
      setGenerating(report.id);
      
      const params = {
        period: selectedPeriod,
        format: 'json',
      };
      
      const result = await report.generator(params);
      
      const reportHeader = {
        title: report.title,
        period: selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1),
        generatedBy: user?.fullName || 'Admin'
      };

      if (selectedFormat === 'pdf') {
        const previewUrl = generatePDFPreview(reportHeader, result, selectedOrientation);
        setPreviewData({ url: previewUrl, header: reportHeader, report });
        setPreviewDialogOpen(true);
      } else {
        toast({
          title: "Preview Not Available",
          description: "Preview is only available for PDF reports.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: 'Preview Failed',
        description: err?.message || 'Unable to generate preview',
        variant: 'destructive'
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateReport = async (report: Report) => {
    try {
      setGenerating(report.id);
      
      const params = {
        period: selectedPeriod,
        format: 'json', // Always get JSON from API first
      };
      
      const result = await report.generator(params);
      
      // Prepare report header
      const reportHeader = {
        title: report.title,
        period: selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1),
        generatedBy: user?.fullName || 'Admin'
      };
      
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `${report.id}-${selectedPeriod}-${timestamp}`;
      
      // Generate report based on selected format
      if (selectedFormat === 'pdf') {
        generatePDFReport(reportHeader, result, `${baseFilename}.pdf`, selectedOrientation);
        saveReportToHistory({
          name: report.title,
          format: 'PDF',
          period: selectedPeriod
        });
        toast({
          title: "✅ PDF Downloaded",
          description: `${report.title} has been downloaded as PDF.`,
        });
      } else if (selectedFormat === 'csv') {
        generateCSVReport(reportHeader, result, `${baseFilename}.csv`);
        saveReportToHistory({
          name: report.title,
          format: 'CSV',
          period: selectedPeriod
        });
        toast({
          title: "✅ CSV Downloaded",
          description: `${report.title} has been downloaded as CSV.`,
        });
      } else if (selectedFormat === 'excel') {
        generateExcelReport(reportHeader, result, `${baseFilename}.xlsx`);
        saveReportToHistory({
          name: report.title,
          format: 'Excel',
          period: selectedPeriod
        });
        toast({
          title: "✅ Excel Downloaded",
          description: `${report.title} has been downloaded as Excel.`,
        });
      } else if (selectedFormat === 'json') {
        generateJSONReport(reportHeader, result, `${baseFilename}.json`);
        saveReportToHistory({
          name: report.title,
          format: 'JSON',
          period: selectedPeriod
        });
        toast({
          title: "✅ JSON Downloaded",
          description: `${report.title} has been downloaded as JSON.`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err?.message || 'Unable to generate report',
        variant: 'destructive'
      });
    } finally {
      setGenerating(null);
    }
  };

  const generateQuickReport = async (period: 'daily' | 'weekly' | 'monthly' = 'weekly', format: 'pdf' | 'csv' | 'excel' | 'json' = 'pdf') => {
    try {
      setGenerating('quick-report');
      
      const result = await generateEngagementSummaryReport({ period, format: 'json' });
      
      const reportHeader = {
        title: `${period.charAt(0).toUpperCase() + period.slice(1)} Engagement Summary`,
        period: period.charAt(0).toUpperCase() + period.slice(1),
        generatedBy: user?.fullName || 'Admin'
      };
      
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `quick-engagement-${period}-${timestamp}`;
      
      if (format === 'pdf') {
        generatePDFReport(reportHeader, result, `${baseFilename}.pdf`, selectedOrientation);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as PDF.`,
        });
      } else if (format === 'csv') {
        generateCSVReport(reportHeader, result, `${baseFilename}.csv`);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as CSV.`,
        });
      } else if (format === 'excel') {
        generateExcelReport(reportHeader, result, `${baseFilename}.xlsx`);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as Excel.`,
        });
      } else {
        generateJSONReport(reportHeader, result, `${baseFilename}.json`);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as JSON.`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err?.message || 'Unable to generate report',
        variant: 'destructive'
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleQuickReport = async (period: 'daily' | 'weekly' | 'monthly', format: 'pdf' | 'csv' | 'excel' | 'json' = 'pdf') => {
    try {
      setGenerating('quick-report');
      
      const result = await generateEngagementSummaryReport({ period, format: 'json' });
      
      const reportHeader = {
        title: `${period.charAt(0).toUpperCase() + period.slice(1)} Engagement Summary`,
        period: period.charAt(0).toUpperCase() + period.slice(1),
        generatedBy: user?.fullName || 'Admin'
      };
      
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `quick-engagement-${period}-${timestamp}`;
      
      if (format === 'pdf') {
        generatePDFReport(reportHeader, result, `${baseFilename}.pdf`, selectedOrientation);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as PDF.`,
        });
      } else if (format === 'csv') {
        generateCSVReport(reportHeader, result, `${baseFilename}.csv`);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as CSV.`,
        });
      } else if (format === 'excel') {
        generateExcelReport(reportHeader, result, `${baseFilename}.xlsx`);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as Excel.`,
        });
      } else {
        generateJSONReport(reportHeader, result, `${baseFilename}.json`);
        toast({
          title: "✅ Quick Report Downloaded",
          description: `${period} engagement report downloaded as JSON.`,
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

  const quickReports = [
    { label: "Daily Overview", period: "daily" as const, icon: Calendar },
    { label: "Weekly Overview", period: "weekly" as const, icon: TrendingUp },
    { label: "Monthly Overview", period: "monthly" as const, icon: BarChart3 },
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
            <div className="grid gap-6 md:grid-cols-3">
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

              {selectedFormat === 'pdf' && (
                <div className="space-y-2">
                  <Label htmlFor="orientation">PDF Orientation</Label>
                  <Select value={selectedOrientation} onValueChange={(value: "portrait" | "landscape") => setSelectedOrientation(value)}>
                    <SelectTrigger id="orientation">
                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                        {selectedFormat === 'pdf' && (
                          <Button 
                            variant="outline"
                            className="gap-2"
                            onClick={() => handlePreviewReport(report)}
                            disabled={isGenerating}
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                        )}
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
                              Download {selectedFormat.toUpperCase()}
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
              Previously generated reports (last 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm">Generated reports will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.date).toLocaleDateString()} • {report.period} • {report.format}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{report.format}</Badge>
                  </div>
                ))}
              </div>
            )}
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

      {/* PDF Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview - {previewData?.header?.title}</DialogTitle>
            <DialogDescription>
              Preview of the report in {selectedOrientation} orientation. Click Download to save the full PDF.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh] w-full">
            {previewData?.url && (
              <div className="w-full">
                <iframe 
                  src={previewData.url} 
                  className="w-full h-[70vh] border rounded"
                  title="PDF Preview"
                />
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (previewData?.report) {
                handleGenerateReport(previewData.report);
                setPreviewDialogOpen(false);
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              Download Full PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Reports;
