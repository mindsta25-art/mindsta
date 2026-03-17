import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Mail,
  Download,
  Trash2,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Send
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading";
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllSubscribers, deleteSubscriber, sendNewsletter, getSentNewsletters } from "@/api/newsletter";

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  source: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

interface SentNewsletter {
  _id: string;
  subject: string;
  message: string;
  sentBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  sentByEmail: string;
  totalSubscribers: number;
  sentCount: number;
  failedCount: number;
  sentAt: string;
  status: 'sent' | 'partial' | 'failed';
  createdAt: string;
  updatedAt: string;
}

const NewsletterSubscribers = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [sentNewsletters, setSentNewsletters] = useState<SentNewsletter[]>([]);
  const [activeTab, setActiveTab] = useState<"subscribers" | "sent">("subscribers");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showNewsletterDialog, setShowNewsletterDialog] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<SentNewsletter | null>(null);
  const [showNewsletterDetailDialog, setShowNewsletterDetailDialog] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchSentNewsletters();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const data = await getAllSubscribers();
      setSubscribers(data.subscribers || []);
    } catch (error: any) {
      console.error('Error fetching subscribers:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch newsletter subscribers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSentNewsletters = async () => {
    try {
      const data = await getSentNewsletters();
      setSentNewsletters(data.newsletters || []);
    } catch (error: any) {
      console.error('Error fetching sent newsletters:', error);
      // Only show error toast for real failures (not 404 / empty collection)
      const status = error?.response?.status;
      if (status !== 404 && status !== 401) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to fetch sent newsletters",
          variant: "destructive",
        });
      }
      // Default to empty list so the tab still renders
      setSentNewsletters([]);
    }
  };

  const handleDelete = async (subscriber: Subscriber) => {
    setSubscriberToDelete(subscriber);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!subscriberToDelete) return;

    try {
      await deleteSubscriber(subscriberToDelete._id);
      toast({
        title: "Success",
        description: "Subscriber deleted successfully",
      });
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error deleting subscriber:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete subscriber",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSubscriberToDelete(null);
    }
  };

  const handleSendNewsletter = async () => {
    if (!newsletterSubject.trim() || !newsletterMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingNewsletter(true);
      
      // Get all active subscribers
      const activeSubscribers = subscribers.filter(s => s.isActive);
      
      if (activeSubscribers.length === 0) {
        toast({
          title: "No Subscribers",
          description: "There are no active subscribers to send the newsletter to",
          variant: "destructive",
        });
        return;
      }

      const result = await sendNewsletter(newsletterSubject, newsletterMessage);

      toast({
        title: "Newsletter Sent!",
        description: `Successfully sent to ${result.sentCount || activeSubscribers.length} subscribers`,
      });

      setShowNewsletterDialog(false);
      setNewsletterSubject("");
      setNewsletterMessage("");
      
      // Refresh sent newsletters list
      fetchSentNewsletters();
    } catch (error: any) {
      console.error('Error sending newsletter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter",
        variant: "destructive",
      });
    } finally {
      setSendingNewsletter(false);
    }
  };

  const exportSubscribers = () => {
    setShowExportDialog(true);
  };

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindsta-newsletter-subscribers-${timestamp}.pdf`;

      // Create PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234);
      doc.text('Mindsta Newsletter Subscribers Report', 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
      doc.text(`Total Subscribers: ${filteredSubscribers.length}`, 14, 34);

      // Prepare table data
      const tableData = filteredSubscribers.map(sub => [
        sub.email,
        sub.isActive ? 'Active' : 'Inactive',
        sub.source.charAt(0).toUpperCase() + sub.source.slice(1),
        new Date(sub.subscribedAt).toLocaleDateString(),
        new Date(sub.updatedAt).toLocaleDateString()
      ]);

      // Add table
      autoTable(doc, {
        head: [['Email', 'Status', 'Source', 'Subscribed Date', 'Last Updated']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: orientation === 'portrait' ? 60 : 80 },
          1: { cellWidth: orientation === 'portrait' ? 25 : 30 },
          2: { cellWidth: orientation === 'portrait' ? 25 : 30 },
          3: { cellWidth: orientation === 'portrait' ? 35 : 45 },
          4: { cellWidth: orientation === 'portrait' ? 35 : 45 },
        },
        margin: { top: 40, right: 14, bottom: 20, left: 14 },
      } as any);

      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const pageHeight = doc.internal.pageSize.height;
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          `© ${new Date().getFullYear()} Mindsta. All rights reserved.`,
          14,
          pageHeight - 10
        );
      }

      // Save PDF
      doc.save(filename);

      toast({
        title: 'Export Successful',
        description: `Exported ${filteredSubscribers.length} subscribers as PDF (${orientation})`,
      });

      setShowPdfDialog(false);
      setShowExportDialog(false);
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExport = (format: 'csv' | 'json' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      setShowPdfDialog(true);
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindsta-newsletter-subscribers-${timestamp}`;

      if (format === 'csv') {
        // Create CSV content
        const headers = ['Email', 'Status', 'Source', 'Subscribed Date', 'Last Updated'];
        const csvRows = [
          headers.join(','),
          ...filteredSubscribers.map(sub => [
            `"${sub.email}"`,
            sub.isActive ? 'Active' : 'Inactive',
            sub.source,
            new Date(sub.subscribedAt).toLocaleDateString(),
            new Date(sub.updatedAt).toLocaleDateString()
          ].join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'json') {
        // Export as JSON
        const jsonData = filteredSubscribers.map(sub => ({
          email: sub.email,
          status: sub.isActive ? 'active' : 'inactive',
          source: sub.source,
          subscribedDate: new Date(sub.subscribedAt).toISOString(),
          lastUpdated: new Date(sub.updatedAt).toISOString(),
          id: sub._id
        }));
        
        const jsonContent = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Export as Excel-compatible CSV with better formatting
        const headers = ['Email', 'Status', 'Source', 'Subscribed Date', 'Last Updated', 'Subscriber ID'];
        const csvRows = [
          headers.join(','),
          ...filteredSubscribers.map(sub => [
            `"${sub.email}"`,
            `"${sub.isActive ? 'Active' : 'Inactive'}"`,
            `"${sub.source}"`,
            `"${new Date(sub.subscribedAt).toLocaleDateString()}"`,
            `"${new Date(sub.updatedAt).toLocaleDateString()}"`,
            `"${sub._id}"`
          ].join(','))
        ];
        
        const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'Export Successful',
        description: `Exported ${filteredSubscribers.length} subscribers as ${format.toUpperCase()}`,
      });
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export subscribers',
        variant: 'destructive'
      });
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && subscriber.isActive) || 
      (filterStatus === "inactive" && !subscriber.isActive);
    const matchesSource = filterSource === "all" || subscriber.source === filterSource;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.isActive).length,
    inactive: subscribers.filter(s => !s.isActive).length,
    home: subscribers.filter(s => s.source === 'home').length,
    student: subscribers.filter(s => s.source === 'student').length,
    settings: subscribers.filter(s => s.source === 'settings').length,
  };

  if (loading) {
    return <LoadingScreen message="Loading newsletter subscribers..." />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h2>
            <p className="text-muted-foreground">
              Manage all newsletter subscriptions and subscribers
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSubscribers} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowNewsletterDialog(true)} variant="default" size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Send className="w-4 h-4 mr-2" />
              Send Newsletter
            </Button>
            <Button onClick={exportSubscribers} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All newsletter subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently subscribed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Unsubscribed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">From Homepage</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.home}</div>
              <p className="text-xs text-muted-foreground">Via homepage footer</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Subscribers and Sent Newsletters */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="subscribers">
              <Users className="w-4 h-4 mr-2" />
              Subscribers ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="w-4 h-4 mr-2" />
              Sent Newsletters ({sentNewsletters.length})
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Subscribers</CardTitle>
                <CardDescription>
                  View and manage all newsletter subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No subscribers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {subscriber.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {subscriber.isActive ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {subscriber.source.charAt(0).toUpperCase() + subscriber.source.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {new Date(subscriber.subscribedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(subscriber.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(subscriber)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Results Summary */}
            {filteredSubscribers.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {filteredSubscribers.length} of {subscribers.length} subscribers
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Sent Newsletters Tab */}
          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sent Newsletters</CardTitle>
                <CardDescription>
                  View history of all sent newsletters
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentNewsletters.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No newsletters sent yet</p>
                    <Button 
                      onClick={() => setShowNewsletterDialog(true)} 
                      variant="outline" 
                      className="mt-4"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Your First Newsletter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentNewsletters.map((newsletter) => (
                      <Card key={newsletter._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{newsletter.subject}</h3>
                                <Badge 
                                  className={
                                    newsletter.status === 'sent' 
                                      ? 'bg-green-500' 
                                      : newsletter.status === 'partial' 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                  }
                                >
                                  {newsletter.status === 'sent' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Sent</>
                                  ) : newsletter.status === 'partial' ? (
                                    <>⚠️ Partial</>
                                  ) : (
                                    <><XCircle className="w-3 h-3 mr-1" /> Failed</>
                                  )}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {newsletter.message}
                              </p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Sent By</p>
                                  <p className="font-medium">{newsletter.sentBy?.fullName || newsletter.sentByEmail}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Recipients</p>
                                  <p className="font-medium">{newsletter.totalSubscribers}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Delivered</p>
                                  <p className="font-medium text-green-600">{newsletter.sentCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Failed</p>
                                  <p className="font-medium text-red-600">{newsletter.failedCount}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(newsletter.sentAt).toLocaleString()}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNewsletter(newsletter);
                                setShowNewsletterDetailDialog(true);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Subscriber"
        description={`Are you sure you want to delete ${subscriberToDelete?.email}? This action cannot be undone.`}
        confirmText="Delete"
        destructive={true}
      />

      {/* Send Newsletter Dialog */}
      <Dialog open={showNewsletterDialog} onOpenChange={setShowNewsletterDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Send Newsletter to Subscribers
            </DialogTitle>
            <DialogDescription>
              This will send an email to all {subscribers.filter(s => s.isActive).length} active subscribers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                placeholder="e.g., New Features & Updates at Mindsta"
                value={newsletterSubject}
                onChange={(e) => setNewsletterSubject(e.target.value)}
                disabled={sendingNewsletter}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Write your newsletter message here... You can include updates, announcements, or promotional content."
                value={newsletterMessage}
                onChange={(e) => setNewsletterMessage(e.target.value)}
                disabled={sendingNewsletter}
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Keep your message clear, engaging, and include a call-to-action
              </p>
            </div>
            
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-purple-900 dark:text-purple-100">Email Preview</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    • Subject: {newsletterSubject || "Your subject line will appear here"}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    • Recipients: {subscribers.filter(s => s.isActive).length} active subscribers
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    • From: Mindsta Team
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNewsletterDialog(false)}
              disabled={sendingNewsletter}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendNewsletter}
              disabled={sendingNewsletter || !newsletterSubject.trim() || !newsletterMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {sendingNewsletter ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Newsletter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Newsletter Subscribers
            </DialogTitle>
            <DialogDescription>
              Choose your preferred export format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Format</Label>
              <div className="grid gap-3">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2">
                    <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">CSV (Comma-Separated)</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Universal format compatible with Excel, Google Sheets, and most tools
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2">
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Excel-Optimized CSV</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Enhanced formatting specifically for Microsoft Excel
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-purple-100 dark:bg-purple-950 p-2">
                    <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">JSON Format</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Developer-friendly format for data processing and APIs
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-red-100 dark:bg-red-950 p-2">
                    <Download className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">PDF Document</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Professional report with portrait or landscape orientation
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold text-foreground mb-1">Export includes:</div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Email Address</li>
                <li>• Subscription Status</li>
                <li>• Subscription Source</li>
                <li>• Subscribed Date</li>
                <li>• Last Updated Date</li>
                <li>• Subscriber ID (JSON & Excel only)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Orientation Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-red-600" />
              PDF Export Options
            </DialogTitle>
            <DialogDescription>
              Choose the page orientation for your PDF export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Orientation</Label>
              <div className="grid gap-3">
                <button
                  onClick={() => {
                    setPdfOrientation('portrait');
                    handleExportPdf('portrait');
                  }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2">
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="7" y="2" width="10" height="20" rx="1" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Portrait</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Vertical orientation (A4: 210mm × 297mm)
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setPdfOrientation('landscape');
                    handleExportPdf('landscape');
                  }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="7" width="20" height="10" rx="1" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Landscape</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Horizontal orientation (A4: 297mm × 210mm) - Better for wide tables
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold text-foreground mb-1">💡 Tip:</div>
              <p className="text-muted-foreground text-xs">
                Landscape orientation provides more space for displaying email addresses and prevents text wrapping.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowPdfDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newsletter Detail Dialog */}
      <Dialog open={showNewsletterDetailDialog} onOpenChange={setShowNewsletterDetailDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Newsletter Details</DialogTitle>
            <DialogDescription>
              Complete information about this sent newsletter
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[calc(90vh-180px)] overflow-y-auto pr-2">
            {selectedNewsletter && (
              <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    className={`mt-1 ${
                      selectedNewsletter.status === 'sent' 
                        ? 'bg-green-500' 
                        : selectedNewsletter.status === 'partial' 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                  >
                    {selectedNewsletter.status === 'sent' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Successfully Sent</>
                    ) : selectedNewsletter.status === 'partial' ? (
                      <>⚠️ Partially Sent</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Failed</>
                    )}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Sent At</p>
                  <p className="text-sm font-medium">{new Date(selectedNewsletter.sentAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm font-semibold">Subject</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedNewsletter.subject}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-semibold">Message Content</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedNewsletter.message}</p>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Delivery Statistics</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedNewsletter.totalSubscribers}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Recipients</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedNewsletter.sentCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Successfully Sent</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedNewsletter.failedCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </div>
                </div>
                
                {/* Success Rate */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Delivery Success Rate</span>
                    <span className="text-sm font-semibold">
                      {((selectedNewsletter.sentCount / selectedNewsletter.totalSubscribers) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(selectedNewsletter.sentCount / selectedNewsletter.totalSubscribers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sender Info */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-semibold">Sent By</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedNewsletter.sentBy?.fullName?.charAt(0) || selectedNewsletter.sentByEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedNewsletter.sentBy?.fullName || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">{selectedNewsletter.sentByEmail}</p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowNewsletterDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default NewsletterSubscribers;
