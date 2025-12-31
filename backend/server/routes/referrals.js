import express from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { Referral, User, ReferralProfile, ReferralTransaction } from '../models/index.js';
import { sendPayoutRequestEmail, sendPayoutProcessedEmail } from '../services/emailService.js';

// Debug: confirm this referrals routes file is loaded
console.log('[ReferralsRoutes] Loaded referrals routes module');

const router = express.Router();

// Get referral statistics (Admin only) - MUST come before /user/:userId
// GET /api/referrals/stats
router.get('/stats', requireAdmin, async (req, res) => {
  console.log('[ReferralsRoutes] GET /api/referrals/stats');
  try {
    const totalReferrals = await Referral.countDocuments();
    const pendingReferrals = await Referral.countDocuments({ status: 'pending' });
    const completedReferrals = await Referral.countDocuments({ status: 'completed' });
    const expiredReferrals = await Referral.countDocuments({ status: 'expired' });
    
    const totalRewards = await Referral.aggregate([
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);
    
    const claimedRewards = await Referral.aggregate([
      { $match: { rewardClaimed: true } },
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);

    // Top referrers
    const topReferrers = await Referral.aggregate([
      {
        $group: {
          _id: '$referrerId',
          totalReferrals: { $sum: 1 },
          completedReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRewards: { $sum: '$rewardAmount' }
        }
      },
      { $sort: { totalReferrals: -1 } },
      { $limit: 10 }
    ]);

    // Populate referrer details
    const referrerIds = topReferrers.map(r => r._id);
    const referrerUsers = await User.find({ _id: { $in: referrerIds } }).select('email fullName');
    const referrerMap = {};
    referrerUsers.forEach(u => {
      referrerMap[u._id.toString()] = { email: u.email, fullName: u.fullName };
    });

    const formattedTopReferrers = topReferrers.map(r => ({
      referrerId: r._id?.toString(),
      referrerEmail: referrerMap[r._id?.toString()]?.email || 'Unknown',
      referrerName: referrerMap[r._id?.toString()]?.fullName || 'Unknown',
      totalReferrals: r.totalReferrals,
      completedReferrals: r.completedReferrals,
      totalRewards: r.totalRewards
    }));

    res.json({
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      expiredReferrals,
      totalRewards: totalRewards[0]?.total || 0,
      claimedRewards: claimedRewards[0]?.total || 0,
      unclaimedRewards: (totalRewards[0]?.total || 0) - (claimedRewards[0]?.total || 0),
      topReferrers: formattedTopReferrers
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
  }
});

// GET /api/referrals/admin/overview - Admin view of all referrers with payment details
router.get('/admin/overview', requireAdmin, async (req, res) => {
  console.log('[ReferralsRoutes] GET /api/referrals/admin/overview');
  try {
    // Get all users with referral type
    const referralUsers = await User.find({ userType: 'referral' })
      .select('email fullName referralCode status createdAt')
      .sort({ createdAt: -1 });
    
    const overview = [];
    
    for (const user of referralUsers) {
      // Get referral profile
      const profile = await ReferralProfile.findOne({ userId: user._id });
      
      // Get referral counts
      const totalReferrals = await Referral.countDocuments({ referrerId: user._id });
      const completedReferrals = await Referral.countDocuments({ 
        referrerId: user._id, 
        status: 'completed' 
      });
      
      // Get pending transactions count
      const pendingTransactions = await ReferralTransaction.countDocuments({
        referrerId: user._id,
        status: 'pending'
      });
      
      overview.push({
        userId: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        referralCode: user.referralCode,
        status: user.status,
        joinedAt: user.createdAt,
        
        // Bank details
        hasBankDetails: !!(profile?.bankName && profile?.accountNumber),
        bankName: profile?.bankName || '',
        bankCode: profile?.bankCode || '',
        accountNumber: profile?.accountNumber || '',
        accountName: profile?.accountName || '',
        
        // Referral stats
        totalReferrals,
        completedReferrals,
        conversionRate: totalReferrals > 0 ? (completedReferrals / totalReferrals * 100).toFixed(1) : 0,
        
        // Earnings
        commissionRate: profile?.commissionRate || 0.1,
        totalEarnings: profile?.totalEarnings || 0,
        pendingEarnings: profile?.pendingEarnings || 0,
        paidOutEarnings: profile?.paidOutEarnings || 0,
        pendingTransactions,
      });
    }
    
    // Calculate totals
    const totals = {
      totalReferrers: overview.length,
      totalReferrals: overview.reduce((sum, r) => sum + r.totalReferrals, 0),
      totalEarnings: overview.reduce((sum, r) => sum + r.totalEarnings, 0),
      totalPendingEarnings: overview.reduce((sum, r) => sum + r.pendingEarnings, 0),
      totalPaidOut: overview.reduce((sum, r) => sum + r.paidOutEarnings, 0),
      referrersWithBankDetails: overview.filter(r => r.hasBankDetails).length,
    };
    
    res.json({
      totals,
      referrers: overview,
    });
  } catch (error) {
    console.error('Error fetching admin referral overview:', error);
    res.status(500).json({ error: 'Failed to fetch referral overview', message: error.message });
  }
});

// POST /api/referrals/admin/payout/:userId - Admin approves payout for a specific referrer
router.post('/admin/payout/:userId', requireAdmin, async (req, res) => {
  console.log('[ReferralsRoutes] POST /api/referrals/admin/payout/' + req.params.userId);
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    
    // Get referral profile
    const profile = await ReferralProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: 'Referral profile not found' });
    }
    
    if (!profile.accountNumber || !profile.bankName) {
      return res.status(400).json({ error: 'Bank details not set for this referrer' });
    }
    
    // Get pending transactions
    const pendingTransactions = await ReferralTransaction.find({ 
      referrerId: userId, 
      status: 'pending' 
    });
    
    if (pendingTransactions.length === 0) {
      return res.status(400).json({ error: 'No pending transactions for this referrer' });
    }
    
    // Create batch ID
    const batchId = `ADMIN_PAYOUT_${Date.now()}_${userId}`;
    let totalCommission = 0;
    
    // Mark all as paid
    for (const tx of pendingTransactions) {
      tx.status = 'paid';
      tx.paidAt = new Date();
      tx.payoutBatchId = batchId;
      if (notes) tx.notes = notes;
      await tx.save();
      totalCommission += tx.commissionAmount;
    }
    
    // Update profile
    profile.pendingEarnings = Math.max(0, profile.pendingEarnings - totalCommission);
    profile.paidOutEarnings += totalCommission;
    await profile.save();
    
    // Send payout processed email to referrer
    try {
      const referrer = await User.findById(userId);
      if (referrer?.email) {
        await sendPayoutProcessedEmail(
          referrer.email,
          referrer.firstName || referrer.fullName || 'Referrer',
          totalCommission / 100,
          profile.accountNumber,
          profile.bankName,
          batchId
        );
      }
    } catch (emailError) {
      console.error('[Payout Processed Email Error]', emailError.message);
    }
    
    res.json({ 
      batchId, 
      paidCount: pendingTransactions.length, 
      amount: totalCommission,
      referrerEmail: (await User.findById(userId).select('email')).email,
      bankDetails: {
        bankName: profile.bankName,
        accountNumber: profile.accountNumber,
        accountName: profile.accountName,
      }
    });
  } catch (error) {
    console.error('Error processing admin payout:', error);
    res.status(500).json({ error: 'Failed to process payout', message: error.message });
  }
});

// Get referrals by user ID
// GET /api/referrals/user/:userId
router.get('/user/:userId', async (req, res) => {
  console.log('[ReferralsRoutes] GET /api/referrals/user/' + req.params.userId);
  try {
    const { userId } = req.params;
    
    const referrals = await Referral.find({ referrerId: userId })
      .populate('referredUserId', 'email fullName userType status')
      .sort({ createdAt: -1 });

    const formattedReferrals = referrals.map(ref => ({
      id: ref._id.toString(),
      referredEmail: ref.referredEmail,
      referredUserId: ref.referredUserId?._id?.toString(),
      referredUserName: ref.referredUserId?.fullName,
      referredUserType: ref.referredUserId?.userType,
      referredUserStatus: ref.referredUserId?.status,
      status: ref.status,
      rewardAmount: ref.rewardAmount,
      rewardClaimed: ref.rewardClaimed,
      createdAt: ref.createdAt,
      updatedAt: ref.updatedAt,
    }));

    res.json(formattedReferrals);
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals', message: error.message });
  }
});

// Get all referrals (Admin only)
// GET /api/referrals
router.get('/', requireAdmin, async (req, res) => {
  console.log('[ReferralsRoutes] GET /api/referrals');
  try {
    const referrals = await Referral.find()
      .populate('referrerId', 'email fullName userType')
      .populate('referredUserId', 'email fullName userType status')
      .sort({ createdAt: -1 });

    const formattedReferrals = referrals.map(ref => ({
      id: ref._id.toString(),
      referrerId: ref.referrerId?._id?.toString(),
      referrerEmail: ref.referrerId?.email,
      referrerName: ref.referrerId?.fullName,
      referrerType: ref.referrerId?.userType,
      referredEmail: ref.referredEmail,
      referredUserId: ref.referredUserId?._id?.toString(),
      referredUserName: ref.referredUserId?.fullName,
      referredUserType: ref.referredUserId?.userType,
      referredUserStatus: ref.referredUserId?.status,
      status: ref.status,
      rewardAmount: ref.rewardAmount,
      rewardClaimed: ref.rewardClaimed,
      createdAt: ref.createdAt,
      updatedAt: ref.updatedAt,
    }));

    res.json(formattedReferrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals', message: error.message });
  }
});

// Create a new referral
// POST /api/referrals
router.post('/', async (req, res) => {
  console.log('[ReferralsRoutes] POST /api/referrals');
  try {
    const { referrerId, referredEmail } = req.body;

    if (!referrerId || !referredEmail) {
      return res.status(400).json({ error: 'referrerId and referredEmail are required' });
    }

    // Check if referral already exists
    const existing = await Referral.findOne({ referrerId, referredEmail });
    if (existing) {
      return res.status(409).json({ error: 'Referral already exists for this email' });
    }

    const referral = await Referral.create({
      referrerId,
      referredEmail,
      status: 'pending',
      rewardAmount: 0
    });

    res.status(201).json({
      id: referral._id.toString(),
      referrerId: referral.referrerId.toString(),
      referredEmail: referral.referredEmail,
      status: referral.status,
      rewardAmount: referral.rewardAmount,
      rewardClaimed: referral.rewardClaimed,
      createdAt: referral.createdAt
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral', message: error.message });
  }
});

// Update referral status (Admin only)
// PATCH /api/referrals/:id
router.patch('/:id', requireAdmin, async (req, res) => {
  console.log('[ReferralsRoutes] PATCH /api/referrals/' + req.params.id);
  try {
    const { id } = req.params;
    const { status, rewardAmount, rewardClaimed, referredUserId } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (rewardAmount !== undefined) updates.rewardAmount = rewardAmount;
    if (rewardClaimed !== undefined) updates.rewardClaimed = rewardClaimed;
    if (referredUserId) updates.referredUserId = referredUserId;

    const referral = await Referral.findByIdAndUpdate(id, updates, { new: true })
      .populate('referrerId', 'email fullName')
      .populate('referredUserId', 'email fullName');

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    res.json({
      id: referral._id.toString(),
      referrerId: referral.referrerId?._id?.toString(),
      referrerEmail: referral.referrerId?.email,
      referrerName: referral.referrerId?.fullName,
      referredEmail: referral.referredEmail,
      referredUserId: referral.referredUserId?._id?.toString(),
      referredUserName: referral.referredUserId?.fullName,
      status: referral.status,
      rewardAmount: referral.rewardAmount,
      rewardClaimed: referral.rewardClaimed,
      updatedAt: referral.updatedAt
    });
  } catch (error) {
    console.error('Error updating referral:', error);
    res.status(500).json({ error: 'Failed to update referral', message: error.message });
  }
});

// Delete referral (Admin only)
// DELETE /api/referrals/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  console.log('[ReferralsRoutes] DELETE /api/referrals/' + req.params.id);
  try {
    const { id } = req.params;
    const referral = await Referral.findByIdAndDelete(id);

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    res.json({ message: 'Referral deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({ error: 'Failed to delete referral', message: error.message });
  }
});

// New endpoints for referral settings and transactions

// GET /api/referrals/me/dashboard - comprehensive dashboard stats for current referral user
router.get('/me/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's referral code
    const user = await User.findById(userId).select('referralCode fullName email userType');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Ensure referral users always have a referralCode
    if (user.userType === 'referral' && !user.referralCode) {
      try {
        await user.save(); // triggers pre('save') to generate code
      } catch (e) {
        console.warn('[ReferralsRoutes] Could not auto-generate referral code:', e.message);
      }
    }
    
    // Get referral profile
    let profile = await ReferralProfile.findOne({ userId });
    if (!profile) {
      profile = await ReferralProfile.create({ userId });
    }
    
    // Get all referrals
    const referrals = await Referral.find({ referrerId: userId })
      .populate('referredUserId', 'fullName email userType createdAt')
      .sort({ createdAt: -1 });
    
    // Count referrals by status
    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    
    // Get recent transactions
    const recentTransactions = await ReferralTransaction.find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'fullName email')
      .populate('paymentId', 'reference amount');
    
    // Calculate conversion rate
    const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals * 100).toFixed(1) : 0;
    
    // Build shareable referral link (frontend will handle the full URL)
    const referralLink = user.referralCode;
    
    res.json({
      // User info
      referralCode: user.referralCode,
      fullName: user.fullName,
      email: user.email,
      referralLink, // Just the code, frontend will construct full URL
      
      // Stats
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      conversionRate: parseFloat(conversionRate),
      
      // Earnings
      totalEarnings: profile.totalEarnings || 0,
      pendingEarnings: profile.pendingEarnings || 0,
      paidOutEarnings: profile.paidOutEarnings || 0,
      commissionRate: profile.commissionRate || 0.1,
      
      // Bank details status
      hasBankDetails: !!(profile.bankName && profile.accountNumber),
      
      // Recent referrals
      recentReferrals: referrals.slice(0, 10).map(ref => ({
        id: ref._id.toString(),
        referredEmail: ref.referredEmail,
        referredUserName: ref.referredUserId?.fullName || 'Pending',
        referredUserId: ref.referredUserId?._id?.toString(),
        status: ref.status,
        rewardAmount: ref.rewardAmount,
        createdAt: ref.createdAt,
        registeredAt: ref.referredUserId?.createdAt,
      })),
      
      // Recent transactions
      recentTransactions: recentTransactions.map(tx => ({
        id: tx._id.toString(),
        studentName: tx.studentId?.fullName || 'Unknown',
        studentEmail: tx.studentId?.email,
        amountPaid: tx.amountPaid,
        commissionAmount: tx.commissionAmount,
        status: tx.status,
        paymentReference: tx.paymentId?.reference,
        createdAt: tx.createdAt,
        paidAt: tx.paidAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching referral dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', message: error.message });
  }
});

// GET /api/referrals/me/settings - current user's referral profile settings
router.get('/me/settings', requireAuth, async (req, res) => {
  try {
    let profile = await ReferralProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ReferralProfile.create({ userId: req.user.id });
    }
    res.json({
      bankName: profile.bankName || '',
      bankCode: profile.bankCode || '',
      accountNumber: profile.accountNumber || '',
      accountName: profile.accountName || '',
      commissionRate: profile.commissionRate,
      totalEarnings: profile.totalEarnings,
      pendingEarnings: profile.pendingEarnings,
      paidOutEarnings: profile.paidOutEarnings,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referral settings', message: error.message });
  }
});

// PUT /api/referrals/me/settings - update bank transfer details and commission rate (optional)
router.put('/me/settings', requireAuth, async (req, res) => {
  try {
    const { bankName, bankCode, accountNumber, accountName, commissionRate } = req.body || {};
    const updates = {};
    if (bankName !== undefined) updates.bankName = bankName;
    if (bankCode !== undefined) updates.bankCode = bankCode;
    if (accountNumber !== undefined) updates.accountNumber = accountNumber;
    if (accountName !== undefined) updates.accountName = accountName;
    if (commissionRate !== undefined) updates.commissionRate = commissionRate;

    const profile = await ReferralProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      bankName: profile.bankName || '',
      bankCode: profile.bankCode || '',
      accountNumber: profile.accountNumber || '',
      accountName: profile.accountName || '',
      commissionRate: profile.commissionRate,
      totalEarnings: profile.totalEarnings,
      pendingEarnings: profile.pendingEarnings,
      paidOutEarnings: profile.paidOutEarnings,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update referral settings', message: error.message });
  }
});

// GET /api/referrals/me/transactions - list referral commissions for current user
router.get('/me/transactions', requireAuth, async (req, res) => {
  try {
    const items = await ReferralTransaction.find({ referrerId: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json(items.map(t => ({
      id: t._id.toString(),
      referralId: t.referralId?.toString(),
      userId: t.userId.toString(),
      studentId: t.studentId?.toString(),
      paymentId: t.paymentId?.toString(),
      amountPaid: t.amountPaid,
      commissionAmount: t.commissionAmount,
      status: t.status,
      paidAt: t.paidAt,
      createdAt: t.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referral transactions', message: error.message });
  }
});

// POST /api/referrals/me/payout - mark all pending transactions as paid and update profile
router.post('/me/payout', requireAuth, async (req, res) => {
  try {
    const profile = await ReferralProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(400).json({ error: 'Referral profile not found' });
    if (!profile.accountNumber || !profile.bankName) {
      return res.status(400).json({ error: 'Bank details required before payout' });
    }
    const pending = await ReferralTransaction.find({ referrerId: req.user.id, status: 'pending' });
    if (pending.length === 0) return res.status(400).json({ error: 'No pending transactions to payout' });
    const batchId = `PAYOUT_${Date.now()}_${req.user.id}`;
    let totalCommission = 0;
    for (const tx of pending) {
      tx.status = 'paid';
      tx.paidAt = new Date();
      tx.payoutBatchId = batchId;
      await tx.save();
      totalCommission += tx.commissionAmount;
    }
    profile.pendingEarnings = Math.max(0, profile.pendingEarnings - totalCommission);
    profile.paidOutEarnings += totalCommission;
    await profile.save();
    
    // Send payout request email to admin
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        await sendPayoutRequestEmail(
          user.firstName || user.fullName || user.email,
          totalCommission / 100,
          profile.accountNumber,
          profile.bankName,
          batchId
        );
      }
    } catch (emailError) {
      console.error('[Payout Request Email Error]', emailError.message);
    }
    
    res.json({ batchId, paidCount: pending.length, amount: totalCommission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payout', message: error.message });
  }
});

export default router;
