import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { Student, Payment, Referral, ReferralProfile, ReferralTransaction, User, Enrollment, Cart } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendPaymentSuccessEmail, sendCommissionEarnedEmail } from '../services/emailService.js';

const router = express.Router();

// Helper to generate unique Paystack reference
function generateReference(userId) {
  return `PSK_${Date.now()}_${userId}_${Math.random().toString(36).slice(2,8)}`;
}

async function handleReferralCommission({ userId, studentId, paymentId, amount }) {
  try {
    // Find referral by referredUserId or referredEmail
    let referral = await Referral.findOne({ referredUserId: userId });
    if (!referral) {
      const user = await User.findById(userId);
      if (user?.email) {
        referral = await Referral.findOne({ referredEmail: user.email });
        if (referral && !referral.referredUserId) {
          referral.referredUserId = userId;
          await referral.save();
        }
      }
    }
    if (!referral || !referral.referrerId) return; // No referrer

    // Load or create referral profile for referrer
    let profile = await ReferralProfile.findOne({ userId: referral.referrerId });
    if (!profile) profile = await ReferralProfile.create({ userId: referral.referrerId });
    const rate = profile.commissionRate || 0.1; // Default 10%
    const commission = Math.round((amount || 0) * rate);

    // Create referral transaction
    const transaction = await ReferralTransaction.create({
      referrerId: referral.referrerId,
      referralId: referral._id,
      userId,
      studentId,
      paymentId,
      amountPaid: amount,
      commissionAmount: commission,
      status: 'pending',
    });

    // Update referral doc
    referral.status = 'completed';
    referral.rewardAmount = commission;
    await referral.save();

    // Update referral profile earnings
    profile.totalEarnings += commission;
    profile.pendingEarnings += commission;
    await profile.save();

    // Send commission email to referrer
    try {
      const referrer = await User.findById(referral.referrerId);
      if (referrer) {
        await sendCommissionEarnedEmail(referrer, transaction, { amount });
      }
    } catch (emailError) {
      console.error('[Email Error]', emailError.message);
      // Don't fail commission creation if email fails
    }
  } catch (e) {
    console.error('[Referral Commission Error]', e.message);
  }
}

// GET /api/payments/status - returns payment status for current user
router.get('/status', requireAuth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).select('isPaid');
    const latestPayment = await Payment.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).select('status amount reference');
    res.json({ isPaid: !!student?.isPaid, lastPayment: latestPayment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment status', message: error.message });
  }
});

// POST /api/payments/initialize - start a Paystack transaction
// Body: { amount: number, callbackUrl?: string, items?: Array }
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    const { amount, callbackUrl, items } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const reference = generateReference(req.user.id);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' });
    }
    const email = req.user.email || req.user.username || 'user@example.com';
    const koboAmount = Math.round(amount * 100); // Paystack expects amount in kobo
    const initData = {
      email,
      amount: koboAmount,
      reference,
      callback_url: callbackUrl || process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:5173/payment/callback'
    };

    const response = await axios.post('https://api.paystack.co/transaction/initialize', initData, {
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
    });

    const { authorization_url, access_code } = response.data.data || {};

    const payment = await Payment.create({
      userId: req.user.id,
      studentId: student._id,
      amount,
      currency: 'NGN',
      reference,
      status: 'pending',
      authorizationUrl: authorization_url,
      accessCode: access_code,
      rawInitialize: response.data,
      items: items.map(item => ({
        subject: item.subject,
        grade: item.grade,
        term: item.term,
        price: item.price || 0,
      })),
    });

    res.status(201).json({ authorizationUrl: authorization_url, reference: payment.reference, accessCode: payment.accessCode });
  } catch (error) {
    console.error('[Paystack Initialize Error]', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize payment', message: error.response?.data?.message || error.message });
  }
});

// GET /api/payments/verify/:reference - verify Paystack transaction
router.get('/verify/:reference', requireAuth, async (req, res) => {
  try {
    const { reference } = req.params;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' });

    const payment = await Payment.findOne({ reference, userId: req.user.id });
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    });

    const data = response.data.data;
    payment.rawVerify = response.data;
    payment.status = data.status === 'success' ? 'success' : data.status;
    const createdEnrollments = [];
    
    if (data.status === 'success') {
      payment.paidAt = new Date(data.paid_at);
      
      // Create enrollments for each item in the payment
      if (payment.items && payment.items.length > 0) {
        for (const item of payment.items) {
          try {
            const enrollment = await Enrollment.findOneAndUpdate(
              {
                userId: req.user.id,
                subject: item.subject,
                grade: item.grade,
                term: item.term,
              },
              {
                userId: req.user.id,
                subject: item.subject,
                grade: item.grade,
                term: item.term,
                paymentId: payment._id,
                purchasePrice: item.price,
                purchasedAt: payment.paidAt,
                isActive: true,
              },
              { upsert: true, new: true }
            );
            createdEnrollments.push({
              subject: item.subject,
              grade: item.grade,
              term: item.term
            });
          } catch (enrollError) {
            console.error(`[Enrollment Error for ${item.subject}]:`, enrollError.message);
          }
        }
      }

      // Clear user's cart
      try {
        await Cart.findOneAndUpdate(
          { userId: req.user.id },
          { items: [], totalAmount: 0 }
        );
      } catch (cartError) {
        console.error('[Cart Clear Error]:', cartError.message);
      }

      // Mark student as paid (legacy)
      const student = await Student.findOne({ userId: req.user.id });
      if (student && !student.isPaid) {
        student.isPaid = true;
        await student.save();
        
        // Send payment success email
        try {
          const user = await User.findById(req.user.id);
          if (user?.email) {
            await sendPaymentSuccessEmail(
              user.email,
              user.firstName || 'Student',
              payment.amount / 100,
              payment.reference
            );
          }
        } catch (emailError) {
          console.error('[Payment Success Email Error]', emailError.message);
        }
      }
      // Referral commission
      await handleReferralCommission({ userId: req.user.id, studentId: student?._id, paymentId: payment._id, amount: payment.amount });
    }
    await payment.save();

    res.json({ 
      status: payment.status, 
      paidAt: payment.paidAt, 
      amount: payment.amount, 
      reference: payment.reference,
      enrollments: createdEnrollments
    });
  } catch (error) {
    console.error('[Paystack Verify Error]', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify payment', message: error.response?.data?.message || error.message });
  }
});

// POST /api/payments/webhook - Paystack webhook listener
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' });
    const signature = req.headers['x-paystack-signature'];
    const computed = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (signature !== computed) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const event = req.body?.event;
    if (event === 'charge.success') {
      const reference = req.body?.data?.reference;
      const payment = await Payment.findOne({ reference });
      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        payment.paidAt = new Date(req.body.data.paid_at || Date.now());
        payment.rawVerify = req.body;
        await payment.save();
        
        // Create enrollments for each item
        if (payment.items && payment.items.length > 0) {
          for (const item of payment.items) {
            try {
              await Enrollment.findOneAndUpdate(
                {
                  userId: payment.userId,
                  subject: item.subject,
                  grade: item.grade,
                  term: item.term,
                },
                {
                  userId: payment.userId,
                  subject: item.subject,
                  grade: item.grade,
                  term: item.term,
                  paymentId: payment._id,
                  purchasePrice: item.price,
                  purchasedAt: payment.paidAt,
                  isActive: true,
                },
                { upsert: true, new: true }
              );
            } catch (enrollError) {
              console.error(`[Enrollment Error for ${item.subject}]:`, enrollError.message);
            }
          }
        }

        // Clear user's cart
        try {
          await Cart.findOneAndUpdate(
            { userId: payment.userId },
            { items: [], totalAmount: 0 }
          );
        } catch (cartError) {
          console.error('[Cart Clear Error]:', cartError.message);
        }

        const student = await Student.findOne({ userId: payment.userId });
        if (student && !student.isPaid) {
          student.isPaid = true;
          await student.save();
          
          // Send payment success email
          try {
            const user = await User.findById(payment.userId);
            if (user?.email) {
              await sendPaymentSuccessEmail(
                user.email,
                user.firstName || 'Student',
                payment.amount / 100,
                payment.reference
              );
            }
          } catch (emailError) {
            console.error('[Payment Success Email Error]', emailError.message);
          }
        }
        await handleReferralCommission({ userId: payment.userId, studentId: student?._id, paymentId: payment._id, amount: payment.amount });
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('[Paystack Webhook Error]', error.message);
    res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
});

// GET /api/payments/admin - list payments (admin)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(200);
    res.json(payments.map(p => ({
      id: p._id.toString(),
      userId: p.userId.toString(),
      studentId: p.studentId?.toString(),
      amount: p.amount,
      currency: p.currency,
      reference: p.reference,
      status: p.status,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to list payments', message: error.message });
  }
});

export default router;
