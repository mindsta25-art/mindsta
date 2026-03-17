import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/apiClient';
import { formatCurrency } from '@/config/siteConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  _id: string;
  type: 'payment' | 'referral_earning' | 'referral_payout';
  amount: number;
  status: string;
  date: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalPayouts: number;
  totalReferralEarnings: number;
  netIncome: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayouts: number;
  completedPayouts: number;
  pendingEarnings: number;
  completedEarnings: number;
}

const FinancialReport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalPayouts: 0,
    totalReferralEarnings: 0,
    netIncome: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    pendingEarnings: 0,
    completedEarnings: 0,
  });
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments
      const paymentsResponse = await api.get('/payments/admin');
      console.log('[FinancialReport] Raw payments response:', paymentsResponse);
      const payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : 
                       Array.isArray(paymentsResponse) ? paymentsResponse : [];
      console.log('[FinancialReport] Payments fetched:', payments.length, payments);

      // Fetch referral earnings/transactions
      const earningsResponse = await api.get('/referrals/admin/transactions');
      console.log('[FinancialReport] Raw earnings response:', earningsResponse);
      const earnings = Array.isArray(earningsResponse.data) ? earningsResponse.data :
                      Array.isArray(earningsResponse) ? earningsResponse : [];
      console.log('[FinancialReport] Earnings fetched:', earnings.length, earnings);

      // Transform payments into transactions
      const paymentTransactions: Transaction[] = payments.map((payment: any) => ({
        _id: payment._id,
        type: 'payment',
        amount: payment.amount || 0,
        status: payment.status || 'unknown',
        date: payment.createdAt || payment.paidAt || new Date().toISOString(),
        user: payment.userId,
        description: `Payment for ${payment.items?.length || 0} item(s)`,
        paymentMethod: payment.paymentMethod || 'Paystack',
        referenceId: payment.reference || payment._id,
      }));
      console.log('[FinancialReport] Payment transactions:', paymentTransactions.length);

      // Extract payouts from transactions (transactions with status 'paid' represent payouts)
      const paidTransactions = earnings.filter((e: any) => e.status === 'paid');
      
      // Group payouts by referrer
      const payoutsByReferrer = paidTransactions.reduce((acc: any, earning: any) => {
        const referrerId = earning.referrerId;
        if (!acc[referrerId]) {
          acc[referrerId] = {
            _id: `payout_${referrerId}`,
            referrerId,
            referrerName: earning.referrerName,
            referrerEmail: earning.referrerEmail,
            totalAmount: 0,
            transactions: [],
            paidAt: earning.paidAt,
          };
        }
        acc[referrerId].totalAmount += (earning.commissionAmount || 0);
        acc[referrerId].transactions.push(earning);
        return acc;
      }, {});

      // Transform grouped payouts into transactions
      const payoutTransactions: Transaction[] = Object.values(payoutsByReferrer).map((payout: any) => ({
        _id: payout._id,
        type: 'referral_payout',
        amount: payout.totalAmount, // Already in Naira
        status: 'completed',
        date: payout.paidAt || new Date().toISOString(),
        user: {
          _id: payout.referrerId,
          fullName: payout.referrerName || 'Unknown',
          email: payout.referrerEmail || 'N/A',
        },
        description: `Referral payout (${payout.transactions.length} transactions)`,
        paymentMethod: 'Bank Transfer',
        referenceId: payout._id,
      }));

      // Transform referral earnings into transactions
      const earningTransactions: Transaction[] = earnings.map((earning: any) => ({
        _id: earning._id,
        type: 'referral_earning',
        amount: earning.commissionAmount, // Already in Naira
        status: earning.status,
        date: earning.createdAt,
        user: earning.referrerId ? {
          _id: earning.referrerId,
          fullName: earning.referrerName || 'Unknown',
          email: earning.referrerEmail || 'N/A',
        } : undefined,
        description: `Referral commission from ${earning.studentName || 'student'}`,
        paymentMethod: 'Commission',
        referenceId: earning.paymentId || earning._id,
      }));

      const allTransactions = [...paymentTransactions, ...payoutTransactions, ...earningTransactions];
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('[FinancialReport] All transactions combined:', allTransactions.length, allTransactions);
      setTransactions(allTransactions);

      // Calculate summary
      const successfulPayments = paymentTransactions.filter(t => t.status === 'success' || t.status === 'completed');
      const failedPayments = paymentTransactions.filter(t => t.status === 'failed');
      const completedPayouts = payoutTransactions.filter(t => t.status === 'completed');
      const pendingPayouts = payoutTransactions.filter(t => t.status === 'pending');
      const completedEarnings = earningTransactions.filter(t => t.status === 'paid');
      const pendingEarnings = earningTransactions.filter(t => t.status === 'pending');

      const totalRevenue = successfulPayments.reduce((sum, t) => sum + t.amount, 0);
      const totalPayouts = completedPayouts.reduce((sum, t) => sum + t.amount, 0);
      const totalReferralEarnings = completedEarnings.reduce((sum, t) => sum + t.amount, 0);

      setSummary({
        totalRevenue,
        totalPayouts,
        totalReferralEarnings,
        netIncome: totalRevenue - totalPayouts,
        totalTransactions: allTransactions.length,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        pendingPayouts: pendingPayouts.length,
        completedPayouts: completedPayouts.length,
        pendingEarnings: pendingEarnings.length,
        completedEarnings: completedEarnings.length,
      });

    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load financial data';
      const detailedMessage = error.response?.data?.message || '';
      
      toast({
        title: 'Error',
        description: detailedMessage ? `${errorMessage}: ${detailedMessage}` : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.status !== 'all' && transaction.status !== filters.status) return false;
    
    if (filters.startDate) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(filters.startDate);
      if (transactionDate < startDate) return false;
    }
    
    if (filters.endDate) {
      const transactionDate = new Date(transaction.date);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (transactionDate > endDate) return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        transaction.user?.fullName?.toLowerCase().includes(searchLower) ||
        transaction.user?.email?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.referenceId?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  console.log('[FinancialReport] Filters:', filters);
  console.log('[FinancialReport] Total transactions:', transactions.length);
  console.log('[FinancialReport] Filtered transactions:', filteredTransactions.length);
  console.log('[FinancialReport] Loading state:', loading);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.type, filters.status, filters.startDate, filters.endDate, filters.search]);

  const exportFinancialReport = () => {
    setShowExportDialog(true);
  };

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindsta-financial-report-${timestamp}.pdf`;

      // Create PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234); // Primary color
      doc.text('Mindsta Financial Report', 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 34);

      // Add financial summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Financial Summary', 14, 44);
      
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const summaryY = 50;
      doc.text(`Total Revenue: ${formatCurrency(summary.totalRevenue)}`, 14, summaryY);
      doc.text(`Total Payouts: ${formatCurrency(summary.totalPayouts)}`, 14, summaryY + 5);
      doc.text(`Total Referral Earnings: ${formatCurrency(summary.totalReferralEarnings)}`, 14, summaryY + 10);
      doc.text(`Net Income: ${formatCurrency(summary.netIncome)}`, 14, summaryY + 15);
      doc.text(`Successful Payments: ${summary.successfulPayments}`, 14, summaryY + 20);
      doc.text(`Failed Payments: ${summary.failedPayments}`, 14, summaryY + 25);

      // Prepare table data
      const tableData = filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type.replace(/_/g, ' ').toUpperCase(),
        t.user?.fullName || 'N/A',
        formatCurrency(t.amount),
        t.status.toUpperCase(),
        (t.description || 'N/A').substring(0, 30),
      ]);

      // Add table
      autoTable(doc, {
        head: [['Date', 'Type', 'User', 'Amount', 'Status', 'Description']],
        body: tableData,
        startY: summaryY + 35,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { top: 40, right: 14, bottom: 20, left: 14 },
        theme: 'striped'
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
        description: `Exported ${filteredTransactions.length} transactions as PDF (${orientation})`,
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
      const filename = `mindsta-financial-report-${timestamp}`;

      if (format === 'csv') {
        // Create CSV content
        const headers = ['Date', 'Type', 'User', 'Email', 'Amount', 'Status', 'Description', 'Reference ID'];
        const csvRows = [
          headers.join(','),
          ...filteredTransactions.map(t => [
            `"${new Date(t.date).toLocaleDateString()}"`,
            `"${t.type.replace(/_/g, ' ')}"`,
            `"${t.user?.fullName || 'N/A'}"`,
            `"${t.user?.email || 'N/A'}"`,
            t.amount,
            t.status,
            `"${(t.description || 'N/A').replace(/"/g, '""')}"`,
            `"${t.referenceId || 'N/A'}"`
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
        const jsonData = filteredTransactions.map(t => ({
          date: new Date(t.date).toISOString(),
          type: t.type,
          user: {
            name: t.user?.fullName || 'N/A',
            email: t.user?.email || 'N/A',
            id: t.user?._id || 'N/A'
          },
          amount: t.amount,
          status: t.status,
          description: t.description || 'N/A',
          referenceId: t.referenceId || 'N/A',
          transactionId: t._id
        }));
        
        const jsonContent = JSON.stringify({
          generatedAt: new Date().toISOString(),
          summary: summary,
          transactions: jsonData,
          totalTransactions: jsonData.length
        }, null, 2);
        
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Export as Excel-compatible CSV with better formatting
        const headers = ['Date', 'Type', 'User', 'Email', 'Amount', 'Status', 'Description', 'Reference ID', 'Transaction ID'];
        const csvRows = [
          headers.join(','),
          ...filteredTransactions.map(t => [
            `"${new Date(t.date).toLocaleDateString()}"`,
            `"${t.type.replace(/_/g, ' ')}"`,
            `"${t.user?.fullName || 'N/A'}"`,
            `"${t.user?.email || 'N/A'}"`,
            t.amount,
            `"${t.status}"`,
            `"${(t.description || 'N/A').replace(/"/g, '""')}"`,
            `"${t.referenceId || 'N/A'}"`,
            `"${t._id}"`
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
        description: `Exported ${filteredTransactions.length} transactions as ${format.toUpperCase()}`,
      });
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export financial report',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      success: { variant: 'default', label: 'Success' },
      completed: { variant: 'default', label: 'Completed' },
      pending: { variant: 'secondary', label: 'Pending' },
      paid: { variant: 'default', label: 'Paid' },
      failed: { variant: 'destructive', label: 'Failed' },
      cancelled: { variant: 'outline', label: 'Cancelled' },
    };
    
    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'referral_payout':
        return <Wallet className="w-4 h-4 text-orange-500" />;
      case 'referral_earning':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      default:
        return <Receipt className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Report</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive overview of all transactions and payouts
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.successfulPayments} successful payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalReferralEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.completedEarnings} paid commissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalPayouts)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.completedPayouts} completed payouts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              {summary.netIncome >= 0 ? (
                <TrendingUp className="h-4 w-4 text-purple-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue - Payouts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                {summary.pendingEarnings} pending earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by name, email, reference..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="referral_earning">Referral Earnings</SelectItem>
                    <SelectItem value="referral_payout">Referral Payouts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={exportFinancialReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button 
                onClick={() => setFilters({ type: 'all', status: 'all', startDate: '', endDate: '', search: '' })} 
                variant="ghost"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.date).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="text-sm capitalize">
                              {transaction.type.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{transaction.user?.fullName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{transaction.user?.email || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{transaction.description}</TableCell>
                        <TableCell className={`font-semibold ${
                          transaction.type === 'payment' ? 'text-green-600' : 
                          transaction.type === 'referral_earning' ? 'text-blue-600' : 
                          'text-orange-600'
                        }`}>
                          {transaction.type === 'payment' || transaction.type === 'referral_earning' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{transaction.referenceId || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
                      <SelectItem value="100">100 / page</SelectItem>
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
      </div>

      {/* Export Format Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Financial Report
            </DialogTitle>
            <DialogDescription>
              Export {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} in your preferred format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Export Format</Label>
              <div className="grid gap-3">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2">
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">CSV Format</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Universal format, works with Excel, Google Sheets, and most tools
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2">
                    <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                      Developer-friendly format with complete summary and transaction data
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
                <li>• Transaction date and type</li>
                <li>• User information (name & email)</li>
                <li>• Amount and status</li>
                <li>• Description and reference ID</li>
                <li>• Financial summary (JSON only)</li>
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
              <div className="font-semibold text-foreground mb-1">📄 PDF will include:</div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Professional header with title and branding</li>
                <li>• Complete financial summary</li>
                <li>• Transaction data in formatted table</li>
                <li>• Page numbers and footer</li>
                <li>• Generation date and time</li>
              </ul>
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
    </AdminLayout>
  );
};

export default FinancialReport;
