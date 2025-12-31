import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, TrendingUp, Users, DollarSign, CheckCircle, Clock, ExternalLink, ListTree, ReceiptText, QrCode, Settings, LogOut, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getMyReferralDashboard, type ReferralDashboard, getReferralsByUserId, type Referral as ReferralItem, getMyReferralTransactions, type ReferralTransactionItem } from '@/api/referrals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'react-qr-code';
import { signOut } from '@/api/auth';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    }
  }
};

export default function ReferralDashboard() {
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'referrals'|'commissions'|'share'|'settings'>('overview');
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [transactions, setTransactions] = useState<ReferralTransactionItem[]>([]);
  const [showTerms, setShowTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    // Lazy load tab data
    if (activeTab === 'referrals' && user?.id) {
      getReferralsByUserId(user.id).then(setReferrals).catch(() => {});
    }
    if (activeTab === 'commissions') {
      getMyReferralTransactions().then(setTransactions).catch(() => {});
    }
  }, [activeTab, user?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getMyReferralDashboard();
      setDashboard(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    if (!dashboard?.referralCode) return '';
    return `${window.location.origin}/auth?mode=register&ref=${dashboard.referralCode}`;
  };

  const copyReferralLink = () => {
    const url = getReferralUrl();
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
  };

  const shareReferralLink = async () => {
    const url = getReferralUrl();
    const text = `Join Mindsta using my referral link and start your learning journey!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Mindsta', text, url });
      } catch (error) {
        // User cancelled share
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Unable to load dashboard</p>
          <Button onClick={loadDashboard} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header & Nav */}
        <motion.div 
          className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Referral Dashboard
            </motion.h1>
            <motion.p 
              className="text-gray-600 mt-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Track your referrals and earnings
            </motion.p>
          </div>
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Button onClick={() => navigate('/referral/settings')}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                signOut();
                refreshUser(); // Update auth context
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </motion.div>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Overview</TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2"><ListTree className="h-4 w-4"/> Referrals</TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2"><ReceiptText className="h-4 w-4"/> Commissions</TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2"><QrCode className="h-4 w-4"/> Share</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="h-4 w-4"/> Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Warning if no bank details */}
            {!dashboard.hasBankDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900">Bank Details Required</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Add your bank details to receive payments for your referral commissions.
                      </p>
                      <Button 
                        onClick={() => navigate('/referral/settings')}
                        className="mt-3 bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        Add Bank Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )}

            {/* Referral Link Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card className="bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Your Referral Link</CardTitle>
                <CardDescription className="text-purple-100">
                  Share this link to invite new students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4 font-mono text-sm break-all">
                    {getReferralUrl()}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={copyReferralLink}
                      className="flex-1 bg-white text-purple-600 hover:bg-purple-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button 
                      onClick={shareReferralLink}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <p className="text-xs text-purple-100 text-center">
                    Your Referral Code: <span className="font-bold">{dashboard.referralCode}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="h-4 w-4 text-purple-600" />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-2xl font-bold text-purple-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    {dashboard.totalReferrals}
                  </motion.div>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboard.completedReferrals} converted ({dashboard.conversionRate}%)
                  </p>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div 
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <motion.div
                    whileHover={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-2xl font-bold text-green-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  >
                    ₦{dashboard.totalEarnings.toLocaleString()}
                  </motion.div>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboard.commissionRate * 100}% commission rate
                  </p>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div 
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock className="h-4 w-4 text-orange-600" />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-2xl font-bold text-orange-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  >
                    ₦{dashboard.pendingEarnings.toLocaleString()}
                  </motion.div>
                  <p className="text-xs text-gray-500 mt-1">
                    Awaiting payout
                  </p>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div 
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-2xl font-bold text-blue-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  >
                    ₦{dashboard.paidOutEarnings.toLocaleString()}
                  </motion.div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total received
                  </p>
                </CardContent>
              </Card>
              </motion.div>
            </motion.div>
            
            {/* Terms and Conditions */}
            <Card className="border-gray-300">
              <CardHeader>
                <button
                  onClick={() => setShowTerms(!showTerms)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <CardTitle>Referral Terms & Conditions</CardTitle>
                  </div>
                  {showTerms ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                <CardDescription>Important guidelines for the referral program</CardDescription>
              </CardHeader>
              {showTerms && (
                <CardContent className="space-y-4 text-sm text-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">1. Program Overview</h4>
                    <p>The Mindsta Referral Program allows you to earn commissions by referring new students to our platform. By participating, you agree to these terms.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">2. Eligibility</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You must be 18 years or older to participate</li>
                      <li>You must have a valid referral account with Mindsta</li>
                      <li>You must provide accurate bank details for payouts</li>
                      <li>Self-referrals are strictly prohibited</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">3. How It Works</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Share your unique referral link with potential students</li>
                      <li>When someone signs up using your link, they become your referral</li>
                      <li>You earn a commission when your referral makes their first payment</li>
                      <li>Commission rate is determined by your agreement with Mindsta</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">4. Commission Payment</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Commissions are calculated based on the student's payment amount</li>
                      <li>Payments are processed within 7-14 business days after verification</li>
                      <li>You must have valid bank details on file to receive payments</li>
                      <li>Minimum payout threshold may apply</li>
                      <li>All payments are subject to applicable taxes and fees</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">5. Prohibited Activities</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Using spam, false advertising, or misleading tactics to get referrals</li>
                      <li>Creating fake accounts or self-referrals</li>
                      <li>Misrepresenting Mindsta's services or pricing</li>
                      <li>Using automated bots or scripts to generate referrals</li>
                      <li>Violating any local, state, or federal laws</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">6. Account Suspension & Termination</h4>
                    <p>Mindsta reserves the right to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                      <li>Suspend or terminate your account for violations</li>
                      <li>Withhold commissions for fraudulent referrals</li>
                      <li>Investigate suspicious activity at any time</li>
                      <li>Modify or discontinue the program with notice</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">7. Refunds & Chargebacks</h4>
                    <p>If a referred student requests a refund or initiates a chargeback, any commission paid for that referral may be deducted from your future earnings.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">8. Privacy & Data Protection</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You must comply with all data protection laws</li>
                      <li>Do not share personal information of referred students</li>
                      <li>Respect the privacy rights of all users</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">9. Intellectual Property</h4>
                    <p>You may use Mindsta branding and materials for referral purposes only. Do not modify logos, create derivative works, or use our brand in a way that implies endorsement without permission.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">10. Changes to Terms</h4>
                    <p>Mindsta may update these terms at any time. Continued participation after changes constitutes acceptance of the new terms. We will notify you of significant changes via email.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">11. Limitation of Liability</h4>
                    <p>Mindsta is not liable for any indirect, incidental, or consequential damages arising from participation in the referral program.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">12. Contact & Support</h4>
                    <p>For questions about the referral program, contact us at <a href="mailto:referrals@mindsta.com" className="text-purple-600 hover:underline">referrals@mindsta.com</a></p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">
                      Last updated: November 13, 2025. By continuing to use the referral program, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>All Referrals</CardTitle>
                  <CardDescription>People who signed up via your link/code</CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <motion.p 
                      className="text-center text-gray-500 py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      No referrals yet
                    </motion.p>
                  ) : (
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {referrals.map((ref, index) => (
                        <motion.div 
                          key={ref.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          variants={itemVariants}
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{ref.referredUserName || 'Pending registration'}</p>
                            <p className="text-xs text-gray-500">{ref.referredEmail}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(ref.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <motion.span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                ref.status === 'completed' ? 'bg-green-100 text-green-800' : ref.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                            >
                              {ref.status}
                            </motion.span>
                            {ref.rewardAmount > 0 && (
                              <motion.p 
                                className="text-sm font-semibold text-green-600 mt-1"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.05 }}
                              >
                                +₦{ref.rewardAmount}
                              </motion.p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>Your earnings per successful payment</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <motion.p 
                      className="text-center text-gray-500 py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      No commissions yet
                    </motion.p>
                  ) : (
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {transactions.map((tx, index) => (
                        <motion.div 
                          key={tx.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          variants={itemVariants}
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex-1">
                            <motion.p 
                              className="font-medium"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 + index * 0.05 }}
                            >
                              Commission: ₦{tx.commissionAmount.toLocaleString()}
                            </motion.p>
                            <p className="text-xs text-gray-500">Payment: ₦{tx.amountPaid.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <motion.span 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.05, type: "spring" }}
                            >
                              {tx.status}
                            </motion.span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Share Your Link</CardTitle>
                    <CardDescription>Copy or share your referral link</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <motion.div 
                      className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {getReferralUrl()}
                    </motion.div>
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button 
                        variant="outline" 
                        onClick={copyReferralLink} 
                        className="flex-1 hover:scale-105 transition-transform"
                      >
                        <Copy className="h-4 w-4 mr-2"/>Copy
                      </Button>
                      <Button 
                        onClick={shareReferralLink} 
                        className="flex-1 hover:scale-105 transition-transform"
                      >
                        <Share2 className="h-4 w-4 mr-2"/>Share
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>QR Code</CardTitle>
                    <CardDescription>Let people scan to join via your link</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center py-6">
                    <motion.div 
                      className="bg-white p-4 rounded-lg shadow"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <QRCode value={getReferralUrl()} size={180} />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Referral Settings</CardTitle>
                    <CardDescription>Manage your bank details and rates</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm text-gray-600">Bank details status: {dashboard.hasBankDetails ? 'Set' : 'Missing'}</p>
                      <p className="text-sm text-gray-600">Commission rate: {dashboard.commissionRate * 100}%</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button 
                        onClick={() => navigate('/referral/settings')}
                        className="hover:scale-105 transition-transform"
                      >
                        <Settings className="h-4 w-4 mr-2"/> Open Settings
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>


              {/* Terms in Settings Tab */}
              <motion.div variants={itemVariants}>
                <Card className="border-gray-300 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <CardTitle>Terms & Conditions</CardTitle>
                    </div>
                    <CardDescription>Review the referral program guidelines</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-gray-700">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">Key Points:</h4>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Earn commissions for every successful student referral</li>
                        <li>Commission paid when referred student makes their first payment</li>
                        <li>Valid bank details required for payouts</li>
                        <li>Fraudulent activity will result in account termination</li>
                        <li>All payments subject to verification</li>
                      </ul>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setActiveTab('overview');
                          setShowTerms(true);
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="w-full hover:scale-105 transition-transform"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Terms & Conditions
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Bottom actions (contextual) */}
        <div className="mt-1" />
      </div>
    </div>
  );
}
