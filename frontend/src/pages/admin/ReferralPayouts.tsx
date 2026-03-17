import { useState, useEffect } from 'react';
import { DollarSign, Users, AlertCircle, CheckCircle, Send, Eye, Download, Search, Filter, X, FileSpreadsheet, Printer, RefreshCw, FileText, File, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAdminReferralOverview, adminProcessPayout, type AdminReferralOverview } from '@/api/referrals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/components/AdminLayout';

const ReferralPayouts = () => {
  const [overview, setOverview] = useState<AdminReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<any>(null);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'no-bank'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'earnings' | 'referrals'>('earnings');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    loadOverview();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, sortBy, searchQuery]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await getAdminReferralOverview();
      setOverview(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load referral data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutClick = (referrer: any) => {
    setSelectedReferrer(referrer);
    setPayoutNotes('');
    setShowPayoutDialog(true);
  };

  const processPayout = async () => {
    if (!selectedReferrer) return;

    try {
      setProcessingPayout(true);
      const result = await adminProcessPayout(selectedReferrer.userId, payoutNotes);
      
      toast({
        title: 'Payout Processed',
        description: `₦${result.amount.toLocaleString()} paid out to ${result.referrerEmail}`,
      });

      setShowPayoutDialog(false);
      setSelectedReferrer(null);
      setPayoutNotes('');
      loadOverview(); // Reload data
    } catch (error: any) {
      toast({
        title: 'Payout Failed',
        description: error.message || 'Failed to process payout',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayout(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!overview) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">Unable to load referral data</p>
            <Button onClick={loadOverview} className="mt-4">Retry</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Filter and sort referrers
  const filteredReferrers = overview.referrers
    .filter(ref => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        ref.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'pending') {
        matchesStatus = ref.pendingEarnings > 0;
      } else if (filterStatus === 'paid') {
        matchesStatus = ref.paidOutEarnings > 0;
      } else if (filterStatus === 'no-bank') {
        matchesStatus = !ref.hasBankDetails;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'referrals') return b.totalReferrals - a.totalReferrals;
      return b.totalEarnings - a.totalEarnings; // default: earnings
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredReferrers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReferrers = filteredReferrers.slice(startIndex, endIndex);

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindsta-referral-payouts-${timestamp}.pdf`;

      // Create PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234); // Primary color
      doc.text('Mindsta Referral Payouts Report', 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
      doc.text(`Total Referrers: ${filteredReferrers.length}`, 14, 34);

      // Prepare table data
      const tableData = filteredReferrers.map(ref => [
        ref.fullName,
        ref.email,
        ref.referralCode,
        ref.totalReferrals.toString(),
        `₦${ref.totalEarnings.toLocaleString()}`,
        `₦${ref.pendingEarnings.toLocaleString()}`,
        `₦${ref.paidOutEarnings.toLocaleString()}`,
        ref.bankName || 'N/A'
      ]);

      // Add table
      autoTable(doc, {
        head: [['Name', 'Email', 'Code', 'Referrals', 'Total', 'Pending', 'Paid', 'Bank']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: orientation === 'portrait' ? 30 : 40 },
          1: { cellWidth: orientation === 'portrait' ? 35 : 50 },
          2: { cellWidth: orientation === 'portrait' ? 20 : 25 },
          3: { cellWidth: orientation === 'portrait' ? 15 : 20 },
          4: { cellWidth: orientation === 'portrait' ? 20 : 25 },
          5: { cellWidth: orientation === 'portrait' ? 20 : 25 },
          6: { cellWidth: orientation === 'portrait' ? 20 : 25 },
          7: { cellWidth: orientation === 'portrait' ? 30 : 40 },
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
        description: `Exported ${filteredReferrers.length} referrers as PDF (${orientation})`,
      });

      setShowPdfDialog(false);
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export as PDF',
        variant: 'destructive'
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
      const filename = `mindsta-referral-payouts-${timestamp}`;

      if (format === 'csv') {
        // Create CSV content
        const headers = ['Name', 'Email', 'Code', 'Referrals', 'Commission Rate', 'Total Earned', 'Pending', 'Paid Out', 'Bank', 'Account'];
        const csvRows = [
          headers.join(','),
          ...filteredReferrers.map(ref => [
            `"${ref.fullName}"`,
            `"${ref.email}"`,
            `"${ref.referralCode}"`,
            ref.totalReferrals,
            `"${((ref.commissionRate || 0.1) * 100).toFixed(0)}%"`,
            ref.totalEarnings.toFixed(2),
            ref.pendingEarnings.toFixed(2),
            ref.paidOutEarnings.toFixed(2),
            `"${ref.bankName || 'N/A'}"`,
            `"${ref.accountNumber || 'N/A'}"`
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
        const jsonData = filteredReferrers.map(ref => ({
          fullName: ref.fullName,
          email: ref.email,
          referralCode: ref.referralCode,
          totalReferrals: ref.totalReferrals,
          commissionRate: ref.commissionRate || 0.1,
          totalEarnings: ref.totalEarnings,
          pendingEarnings: ref.pendingEarnings,
          paidOutEarnings: ref.paidOutEarnings,
          bankName: ref.bankName || null,
          accountNumber: ref.accountNumber || null,
          accountName: ref.accountName || null,
          hasBankDetails: ref.hasBankDetails
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
        const headers = ['Name', 'Email', 'Code', 'Referrals', 'Commission Rate', 'Total Earned', 'Pending', 'Paid Out', 'Bank', 'Account Number', 'Account Name'];
        const csvRows = [
          headers.join(','),
          ...filteredReferrers.map(ref => [
            `"${ref.fullName}"`,
            `"${ref.email}"`,
            `"${ref.referralCode}"`,
            `"${ref.totalReferrals}"`,
            `"${((ref.commissionRate || 0.1) * 100).toFixed(0)}%"`,
            `"${ref.totalEarnings.toFixed(2)}"`,
            `"${ref.pendingEarnings.toFixed(2)}"`,
            `"${ref.paidOutEarnings.toFixed(2)}"`,
            `"${ref.bankName || 'N/A'}"`,
            `"${ref.accountNumber || 'N/A'}"`,
            `"${ref.accountName || 'N/A'}"`
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
        description: `Exported ${filteredReferrers.length} referrers as ${format.toUpperCase()}`,
      });
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export referral data',
        variant: 'destructive'
      });
    }
  };

  const handleExportCSV = () => {
    handleExport('csv');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Referral Payouts
          </h1>
          <p className="text-muted-foreground mt-2">Manage referrer payments and bank details</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overview.totals.totalReferrers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.totals.totalReferrals} total referrals
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₦{(overview.totals.totalEarnings || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All commissions earned
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                ₦{(overview.totals.totalPendingEarnings || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                ₦{(overview.totals.totalPaidOut || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.totals.referrersWithBankDetails} with bank details
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Info Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Commission Structure</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Referrers earn a <strong className="text-purple-600">10% commission</strong> on every course/lesson 
                  purchase made by their referred students. The commission is calculated at the time of payment 
                  and tracked in real-time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">10% default rate for all referrers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Calculated on final purchase amount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Paid out after bank verification</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Referrers</SelectItem>
                  <SelectItem value="pending">With Pending</SelectItem>
                  <SelectItem value="paid">Has Paid Out</SelectItem>
                  <SelectItem value="no-bank">No Bank Details</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earnings">By Earnings</SelectItem>
                  <SelectItem value="referrals">By Referrals</SelectItem>
                  <SelectItem value="name">By Name</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={loadOverview} title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowExportDialog(true)} 
                  title="Export Data"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            {(searchQuery || filterStatus !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">
                  {filteredReferrers.length} of {overview.referrers.length} referrers
                </Badge>
                {(searchQuery || filterStatus !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Referrer Accounts</CardTitle>
            <CardDescription>View bank details and process payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                    <TableHead className="text-right">Comm. Rate</TableHead>
                    <TableHead className="text-right">Total Earned</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Paid Out</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        {searchQuery || filterStatus !== 'all' ? 'No referrers match your filters' : 'No referrers found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReferrers.map((referrer) => (
                      <TableRow key={referrer.userId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{referrer.fullName}</p>
                            <p className="text-xs text-muted-foreground">{referrer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {referrer.referralCode}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">{referrer.totalReferrals}</p>
                            <p className="text-xs text-muted-foreground">
                              {referrer.completedReferrals} completed
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            referrer.conversionRate >= 50 
                              ? 'text-green-600' 
                              : referrer.conversionRate >= 25
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                          }`}>
                            {referrer.conversionRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {((referrer.commissionRate || 0.1) * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{(referrer.totalEarnings || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            referrer.pendingEarnings > 0 ? 'text-orange-500' : 'text-muted-foreground'
                          }`}>
                            ₦{(referrer.pendingEarnings || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          ₦{(referrer.paidOutEarnings || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {referrer.hasBankDetails ? (
                            <div className="text-xs">
                              <p className="font-medium">{referrer.bankName}</p>
                              <p className="text-muted-foreground">{referrer.accountNumber}</p>
                              <p className="text-muted-foreground">{referrer.accountName}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handlePayoutClick(referrer)}
                            disabled={!referrer.hasBankDetails || referrer.pendingEarnings === 0}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredReferrers.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredReferrers.length)} of {filteredReferrers.length} referrers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 / page</SelectItem>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Dialog */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payout</DialogTitle>
              <DialogDescription>
                Confirm payout for {selectedReferrer?.fullName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedReferrer && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Referrer:</span>
                    <span className="font-medium">{selectedReferrer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedReferrer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <span className="font-medium">{selectedReferrer.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account:</span>
                    <span className="font-medium">{selectedReferrer.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedReferrer.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Commission Rate:</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {((selectedReferrer.commissionRate || 0.1) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Pending Transactions:</span>
                    <span className="font-medium">{selectedReferrer.pendingTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Payout Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₦{(selectedReferrer.pendingEarnings || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Payment Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add transaction reference or notes..."
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPayoutDialog(false)}
                disabled={processingPayout}
              >
                Cancel
              </Button>
              <Button 
                onClick={processPayout}
                disabled={processingPayout}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingPayout ? 'Processing...' : 'Confirm Payout'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Referral Payouts Data</DialogTitle>
              <DialogDescription>
                Choose a format to export {filteredReferrers.length} referrer records
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleExport('csv')}
              >
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <span className="font-semibold">CSV</span>
                <span className="text-xs text-muted-foreground">Spreadsheet format</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleExport('excel')}
              >
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <span className="font-semibold">Excel</span>
                <span className="text-xs text-muted-foreground">Excel compatible</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleExport('json')}
              >
                <FileText className="h-8 w-8 text-purple-600" />
                <span className="font-semibold">JSON</span>
                <span className="text-xs text-muted-foreground">Developer format</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleExport('pdf')}
              >
                <File className="h-8 w-8 text-red-600" />
                <span className="font-semibold">PDF</span>
                <span className="text-xs text-muted-foreground">Print ready</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Orientation Dialog */}
        <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose PDF Orientation</DialogTitle>
              <DialogDescription>
                Select page orientation for the PDF export
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3"
                onClick={() => handleExportPdf('portrait')}
              >
                <div className="w-16 h-20 border-2 border-gray-300 rounded flex items-center justify-center">
                  <Printer className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="font-semibold">Portrait</span>
                <span className="text-xs text-muted-foreground">Vertical layout</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3"
                onClick={() => handleExportPdf('landscape')}
              >
                <div className="w-20 h-16 border-2 border-gray-300 rounded flex items-center justify-center">
                  <Printer className="h-6 w-10 text-muted-foreground" />
                </div>
                <span className="font-semibold">Landscape</span>
                <span className="text-xs text-muted-foreground">Horizontal layout</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ReferralPayouts;
