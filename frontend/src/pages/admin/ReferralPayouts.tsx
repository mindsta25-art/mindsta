import { useState, useEffect } from 'react';
import { DollarSign, Users, AlertCircle, CheckCircle, Send, Eye, Download } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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
  const { toast } = useToast();

  useEffect(() => {
    loadOverview();
  }, []);

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
            <p className="text-gray-600">Unable to load referral data</p>
            <Button onClick={loadOverview} className="mt-4">Retry</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Referral Payouts
          </h1>
          <p className="text-gray-600 mt-2">Manage referrer payments and bank details</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overview.totals.totalReferrers}</div>
              <p className="text-xs text-gray-500 mt-1">
                {overview.totals.totalReferrals} total referrals
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₦{overview.totals.totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All commissions earned
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₦{overview.totals.totalPendingEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₦{overview.totals.totalPaidOut.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {overview.totals.referrersWithBankDetails} with bank details
              </p>
            </CardContent>
          </Card>
        </div>

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
                    <TableHead className="text-right">Total Earned</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Paid Out</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.referrers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                        No referrers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    overview.referrers.map((referrer) => (
                      <TableRow key={referrer.userId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{referrer.fullName}</p>
                            <p className="text-xs text-gray-500">{referrer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {referrer.referralCode}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">{referrer.totalReferrals}</p>
                            <p className="text-xs text-gray-500">
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
                              : 'text-gray-600'
                          }`}>
                            {referrer.conversionRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{referrer.totalEarnings.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            referrer.pendingEarnings > 0 ? 'text-orange-600' : 'text-gray-400'
                          }`}>
                            ₦{referrer.pendingEarnings.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          ₦{referrer.paidOutEarnings.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {referrer.hasBankDetails ? (
                            <div className="text-xs">
                              <p className="font-medium">{referrer.bankName}</p>
                              <p className="text-gray-500">{referrer.accountNumber}</p>
                              <p className="text-gray-500">{referrer.accountName}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not set</span>
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
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Referrer:</span>
                    <span className="font-medium">{selectedReferrer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium">{selectedReferrer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bank:</span>
                    <span className="font-medium">{selectedReferrer.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account:</span>
                    <span className="font-medium">{selectedReferrer.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="font-medium">{selectedReferrer.accountName}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Pending Transactions:</span>
                    <span className="font-medium">{selectedReferrer.pendingTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Payout Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₦{selectedReferrer.pendingEarnings.toLocaleString()}
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
      </div>
    </AdminLayout>
  );
};

export default ReferralPayouts;
