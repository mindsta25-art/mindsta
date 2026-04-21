import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Activity,
  Search,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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

      // Transform payments into transactions (exclude pending â€” not yet paid)
      const paymentTransactions: Transaction[] = payments
        .filter((payment: any) => payment.status !== 'pending')
        .map((payment: any) => ({
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
          `Â© ${new Date().getFullYear()} Mindsta. All rights reserved.`,
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

  const monthlyChartData = useMemo(() => {
    const buckets: Record<string, { month: string; revenue: number; payouts: number; commissions: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = { month: d.toLocaleString('default', { month: 'short', year: '2-digit' }), revenue: 0, payouts: 0, commissions: 0 };
    }
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!buckets[key]) return;
      if (t.type === 'payment' && (t.status === 'success' || t.status === 'completed')) buckets[key].revenue += t.amount;
      else if (t.type === 'referral_payout') buckets[key].payouts += t.amount;
      else if (t.type === 'referral_earning' && t.status === 'paid') buckets[key].commissions += t.amount;
    });
    return Object.values(buckets);
  }, [transactions]);

  const typeChartData = useMemo(() => [
    { name: 'Revenue', value: summary.totalRevenue, color: '#22c55e' },
    { name: 'Ref Earnings', value: summary.totalReferralEarnings, color: '#3b82f6' },
    { name: 'Payouts', value: summary.totalPayouts, color: '#f97316' },
  ].filter(d => d.value > 0), [summary]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 shadow-xl">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium uppercase tracking-widest">Admin Panel</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Financial Report</h1>
              <p className="text-white/70 mt-1 text-sm">
                {loading ? 'Loading dataâ€¦' : `${filteredTransactions.length} transactions Â· Real-time data`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-2"
                onClick={fetchFinancialData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-2"
                onClick={exportFinancialReport}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-24 bg-green-200 dark:bg-green-800 rounded" />
                  <div className="h-8 w-32 bg-green-200 dark:bg-green-800 rounded" />
                  <div className="h-3 w-20 bg-green-100 dark:bg-green-900 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Total Revenue</span>
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.totalRevenue)}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400">{summary.successfulPayments} successful payments</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card className={`border-0 shadow-md ${summary.netIncome >= 0 ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40'}`}>
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-20 bg-purple-200 dark:bg-purple-800 rounded" />
                  <div className="h-8 w-28 bg-purple-200 dark:bg-purple-800 rounded" />
                  <div className="h-3 w-24 bg-purple-100 dark:bg-purple-900 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${summary.netIncome >= 0 ? 'text-purple-700 dark:text-purple-400' : 'text-red-700 dark:text-red-400'}`}>Net Income</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${summary.netIncome >= 0 ? 'bg-purple-100 dark:bg-purple-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      {summary.netIncome >= 0
                        ? <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(summary.netIncome)}
                  </div>
                  <span className={`text-xs mt-2 block ${summary.netIncome >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>Revenue minus payouts</span>
                </>
              )}
            </CardContent>
          </Card>

          {/* Referral Earnings */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-28 bg-blue-200 dark:bg-blue-800 rounded" />
                  <div className="h-8 w-24 bg-blue-200 dark:bg-blue-800 rounded" />
                  <div className="h-3 w-20 bg-blue-100 dark:bg-blue-900 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Referral Earnings</span>
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(summary.totalReferralEarnings)}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">{summary.completedEarnings} paid commissions</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Payouts */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-24 bg-orange-200 dark:bg-orange-800 rounded" />
                  <div className="h-8 w-28 bg-orange-200 dark:bg-orange-800 rounded" />
                  <div className="h-3 w-20 bg-orange-100 dark:bg-orange-900 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Total Payouts</span>
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(summary.totalPayouts)}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-orange-600 dark:text-orange-400">{summary.completedPayouts} completed payouts</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Successful Payments</p>
              <p className="text-xl font-bold">{loading ? 'â€”' : summary.successfulPayments}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed Payments</p>
              <p className="text-xl font-bold">{loading ? 'â€”' : summary.failedPayments}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Earnings</p>
              <p className="text-xl font-bold">{loading ? 'â€”' : summary.pendingEarnings}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-xl font-bold">{loading ? 'â€”' : summary.totalTransactions}</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Revenue Trend Area Chart */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Revenue Trend
              </CardTitle>
              <CardDescription className="text-xs">Monthly revenue vs payouts (last 12 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-52 bg-muted rounded-xl animate-pulse" />
              ) : monthlyChartData.every(d => d.revenue === 0 && d.payouts === 0) ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No chart data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `â‚¦${(v / 1000).toFixed(0)}k`} width={52} />
                    <RechartsTooltip
                      formatter={(value: number) => [formatCurrency(value)]}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
                    <Area type="monotone" dataKey="payouts" stroke="#f97316" strokeWidth={2} fill="url(#colorPayouts)" name="Payouts" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart â€” Type Breakdown */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                By Type
              </CardTitle>
              <CardDescription className="text-xs">Transaction type distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-52 bg-muted rounded-xl animate-pulse" />
              ) : typeChartData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={typeChartData} cx="50%" cy="44%" outerRadius={72} innerRadius={36} dataKey="value" paddingAngle={3}>
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [formatCurrency(value)]}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search name, email, refâ€¦"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="referral_earning">Referral Earnings</SelectItem>
                  <SelectItem value="referral_payout">Referral Payouts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="pl-9" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="pl-9" />
              </div>
            </div>
            {(filters.type !== 'all' || filters.status !== 'all' || filters.startDate || filters.endDate || filters.search) && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}</span>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={() => setFilters({ type: 'all', status: 'all', startDate: '', endDate: '', search: '' })}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Transactions</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {loading ? 'Loadingâ€¦' : `Showing ${filteredTransactions.length === 0 ? 0 : startIndex + 1}â€“${Math.min(endIndex, filteredTransactions.length)} of ${filteredTransactions.length}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide pl-4">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">User</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide hidden lg:table-cell pr-4">Ref ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell className="pl-4"><div className="h-4 bg-muted rounded w-20" /><div className="h-3 bg-muted rounded w-14 mt-1" /></TableCell>
                        <TableCell><div className="h-6 bg-muted rounded-full w-24" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-28" /><div className="h-3 bg-muted rounded w-32 mt-1" /></TableCell>
                        <TableCell className="hidden md:table-cell"><div className="h-4 bg-muted rounded w-36" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-16" /></TableCell>
                        <TableCell><div className="h-6 bg-muted rounded-full w-16" /></TableCell>
                        <TableCell className="hidden lg:table-cell pr-4"><div className="h-4 bg-muted rounded w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-25" />
                        <p className="text-sm">No transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-4">
                          <div className="font-medium text-sm">{new Date(transaction.date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'payment'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                              : transaction.type === 'referral_earning'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                          }`}>
                            {getTransactionIcon(transaction.type)}
                            <span className="capitalize hidden sm:inline">{transaction.type.replace(/_/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{transaction.user?.fullName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{transaction.user?.email || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                          {transaction.description || 'â€”'}
                        </TableCell>
                        <TableCell className={`font-semibold text-sm ${
                          transaction.type === 'payment' ? 'text-green-600 dark:text-green-400'
                          : transaction.type === 'referral_earning' ? 'text-blue-600 dark:text-blue-400'
                          : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {transaction.type === 'referral_payout' ? 'âˆ’' : '+'}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell pr-4 max-w-[130px] truncate">
                          {transaction.referenceId || 'â€”'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Bar */}
            {!loading && filteredTransactions.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px] h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    <ChevronLeft className="w-3 h-3" /><ChevronLeft className="w-3 h-3 -ml-2" />
                  </Button>
                  <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs px-2 min-w-[80px] text-center">Page {currentPage} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-3 h-3" /><ChevronRight className="w-3 h-3 -ml-2" />
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
                <button onClick={() => handleExport('csv')} className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors">
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2"><Download className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">CSV Format</div>
                    <div className="text-xs text-muted-foreground mt-1">Universal format, works with Excel, Google Sheets, and most tools</div>
                  </div>
                </button>
                <button onClick={() => handleExport('excel')} className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors">
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2"><Download className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Excel-Optimized CSV</div>
                    <div className="text-xs text-muted-foreground mt-1">Enhanced formatting specifically for Microsoft Excel</div>
                  </div>
                </button>
                <button onClick={() => handleExport('json')} className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors">
                  <div className="rounded-md bg-purple-100 dark:bg-purple-950 p-2"><Download className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">JSON Format</div>
                    <div className="text-xs text-muted-foreground mt-1">Developer-friendly format with complete summary and transaction data</div>
                  </div>
                </button>
                <button onClick={() => handleExport('pdf')} className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors">
                  <div className="rounded-md bg-red-100 dark:bg-red-950 p-2"><Download className="w-4 h-4 text-red-600 dark:text-red-400" /></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">PDF Document</div>
                    <div className="text-xs text-muted-foreground mt-1">Professional report with portrait or landscape orientation</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold text-foreground mb-1">Export includes:</div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>â€¢ Transaction date and type</li>
                <li>â€¢ User information (name &amp; email)</li>
                <li>â€¢ Amount and status</li>
                <li>â€¢ Description and reference ID</li>
                <li>â€¢ Financial summary (JSON only)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
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
            <DialogDescription>Choose the page orientation for your PDF export</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Orientation</Label>
              <div className="grid gap-3">
                <button
                  onClick={() => { setPdfOrientation('portrait'); handleExportPdf('portrait'); }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="7" y="2" width="10" height="20" rx="1" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Portrait</div>
                    <div className="text-xs text-muted-foreground mt-1">Vertical orientation (A4: 210mm Ã— 297mm)</div>
                  </div>
                </button>
                <button
                  onClick={() => { setPdfOrientation('landscape'); handleExportPdf('landscape'); }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="10" rx="1" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Landscape</div>
                    <div className="text-xs text-muted-foreground mt-1">Horizontal orientation (A4: 297mm Ã— 210mm) â€” Better for wide tables</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold text-foreground mb-1">PDF will include:</div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>â€¢ Professional header with title and branding</li>
                <li>â€¢ Complete financial summary</li>
                <li>â€¢ Transaction data in formatted table</li>
                <li>â€¢ Page numbers and footer</li>
                <li>â€¢ Generation date and time</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowPdfDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default FinancialReport;
