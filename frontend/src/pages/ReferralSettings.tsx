import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getMyReferralSettings, updateMyReferralSettings, getMyReferralTransactions, requestReferralPayout, ReferralSettings as RS, ReferralTransactionItem } from '@/api/referrals';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, Settings, Wallet, ReceiptText, ArrowLeft, AlertTriangle, Moon, Sun, Lock, Eye, EyeOff } from 'lucide-react';
import ReferralHeader from '@/components/ReferralHeader';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { bankDetailsSchema, type BankDetailsFormData } from '@/lib/validations';

const ReferralSettings = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState<RS | null>(null);
  const [transactions, setTransactions] = useState<ReferralTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState<'bank'|'earnings'|'transactions'|'theme'|'security'>('bank');
  const navigate = useNavigate();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const bankForm = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountNumber: '',
      bankName: '',
      accountName: '',
      commissionRate: 0
    }
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        getMyReferralSettings(),
        getMyReferralTransactions()
      ]);
      setSettings(s);
      setTransactions(t);
      
      // Populate form with loaded settings
      if (s) {
        bankForm.reset({
          accountNumber: s.accountNumber || '',
          bankName: s.bankName || '',
          accountName: s.accountName || '',
          commissionRate: (s.commissionRate || 0) * 100
        });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load referral settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onBankSubmit = async (data: BankDetailsFormData) => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateMyReferralSettings({
        ...settings,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        accountName: data.accountName,
        commissionRate: data.commissionRate / 100
      });
      setSettings(updated);
      toast({ title: 'Saved', description: 'Bank details updated successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateMyReferralSettings(settings);
      setSettings(updated);
      toast({ title: 'Saved', description: 'Referral settings updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePayout = async () => {
    setPayoutLoading(true);
    try {
      const result = await requestReferralPayout();
      toast({ title: 'Payout Requested', description: `Batch ${result.batchId} - ₦${result.amount}` });
      await load();
      setConfirmOpen(false);
    } catch (e: any) {
      toast({ title: 'Payout Failed', description: e.message || 'Unable to process payout', variant: 'destructive' });
    } finally {
      setPayoutLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (!currentPassword) {
      toast({
        title: 'Error',
        description: 'Current password is required',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    
    try {
      const { changePassword } = await import('@/api/auth');
      const result = await changePassword(user.id, currentPassword, newPassword);
      
      toast({
        title: '✅ Success',
        description: result.message || 'Password changed successfully',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to change password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading referral settings...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-background dark:via-background dark:to-background">
      <ReferralHeader />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Referral Settings</h1>
        <Button variant="outline" onClick={() => navigate('/referral/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="bank" className="flex items-center gap-2"><Banknote className="h-4 w-4"/> Bank & Commission</TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2"><Wallet className="h-4 w-4"/> Earnings & Payout</TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2"><ReceiptText className="h-4 w-4"/> Transactions</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Lock className="h-4 w-4"/> Security</TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">{theme === 'dark' ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>} Theme</TabsTrigger>
        </TabsList>

        {/* Bank & Commission Tab */}
        <TabsContent value="bank">
          <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input 
                    {...bankForm.register('bankName')}
                    className="w-full border rounded px-3 py-2 dark:bg-background dark:border-gray-700 dark:text-foreground" 
                    placeholder="e.g. Access Bank"
                  />
                  {bankForm.formState.errors.bankName && (
                    <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.bankName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Code</label>
                  <input 
                    value={settings?.bankCode || ''} 
                    onChange={e => setSettings(s => s ? { ...s, bankCode: e.target.value } : s)} 
                    className="w-full border rounded px-3 py-2 dark:bg-background dark:border-gray-700 dark:text-foreground"
                    placeholder="e.g. 044" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input 
                    {...bankForm.register('accountNumber')}
                    className="w-full border rounded px-3 py-2 dark:bg-background dark:border-gray-700 dark:text-foreground"
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                  {bankForm.formState.errors.accountNumber && (
                    <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.accountNumber.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Name</label>
                  <input 
                    {...bankForm.register('accountName')}
                    className="w-full border rounded px-3 py-2 dark:bg-background dark:border-gray-700 dark:text-foreground"
                    placeholder="Full account name"
                  />
                  {bankForm.formState.errors.accountName && (
                    <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.accountName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                  <input 
                    type="text"
                    readOnly
                    value={`${((settings?.commissionRate || 0) * 100).toFixed(1)}%`}
                    className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-muted dark:border-gray-700 dark:text-foreground text-muted-foreground cursor-not-allowed select-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your commission rate is set by admin and cannot be changed here.</p>
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={saving}>
                    <Settings className="h-4 w-4 mr-2"/>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Earnings & Payout Tab */}
        <TabsContent value="earnings">
          <div className="grid md:grid-cols-4 gap-4">
            <Stat label="Total Earnings" value={`₦${(settings?.totalEarnings || 0).toLocaleString()}`} />
            <Stat label="Pending" value={`₦${(settings?.pendingEarnings || 0).toLocaleString()}`} />
            <Stat label="Paid Out" value={`₦${(settings?.paidOutEarnings || 0).toLocaleString()}`} />
            <div className="flex items-center justify-center">
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button disabled={payoutLoading || (settings?.pendingEarnings || 0) <= 0}>
                    {payoutLoading ? 'Processing...' : 'Request Payout'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600"/> Confirm Payout Request</DialogTitle>
                    <DialogDescription>
                      You are about to request payout for <strong>₦{(settings?.pendingEarnings || 0).toLocaleString()}</strong> in pending commissions.
                      This will mark those commissions as paid and generate a payout batch. Continue?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={payoutLoading}>Cancel</Button>
                    <Button onClick={handlePayout} disabled={payoutLoading} className="bg-orange-600 hover:bg-orange-700">
                      {payoutLoading ? 'Submitting...' : 'Confirm Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 text-left">Created</th>
                    <th className="p-2 text-left">Amount Paid</th>
                    <th className="p-2 text-left">Commission</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-t">
                      <td className="p-2">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="p-2">₦{tx.amountPaid.toLocaleString()}</td>
                      <td className="p-2">₦{tx.commissionAmount.toLocaleString()}</td>
                      <td className="p-2 capitalize">{tx.status}</td>
                      <td className="p-2">{tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Change Password
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Update your account password to keep your referral portal secure
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2 pr-10 dark:bg-background dark:border-gray-700 dark:text-foreground"
                        placeholder="Enter current password"
                        required
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2 pr-10 dark:bg-background dark:border-gray-700 dark:text-foreground"
                        placeholder="Enter new password (min. 8 characters)"
                        required
                      />
                      <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2 pr-10 dark:bg-background dark:border-gray-700 dark:text-foreground"
                        placeholder="Confirm new password"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={changingPassword} className="gap-2">
                    <Lock className="w-4 h-4" />
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Referral Portal Theme</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize the appearance of your referral portal
                  </p>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Current Theme</div>
                    <div className="text-sm text-muted-foreground">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleTheme()}
                      disabled={theme === 'light'}
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleTheme()}
                      disabled={theme === 'dark'}
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    ✨ Your theme preference is saved separately for referral, student, and admin portals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </CardContent>
  </Card>
);

export default ReferralSettings;
