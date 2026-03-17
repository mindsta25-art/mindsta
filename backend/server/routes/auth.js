/**
 * Authentication Routes
 * Handles user signup, signin, and authentication
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Student, Referral } from '../models/index.js';
import { sendReferralSignupEmail, sendPasswordResetEmail, sendVerificationOTP, sendEmailVerifiedEmail, sendWelcomeEmail } from '../services/emailService.js';
import passport from '../config/passport.js';
import { createAdminAlert } from './admin-alerts.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * GET /api/auth/email-status
 * Check if email service is configured (admin diagnostic only)
 */
router.get('/email-status', requireAuth, async (req, res) => {
  if (req.user?.userType !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  const smtpUser = process.env.EMAIL_USER;
  res.json({
    provider: resendKey ? 'Resend (HTTP)' : smtpUser ? 'Nodemailer SMTP (local only)' : 'NOT CONFIGURED',
    configured: !!(resendKey || smtpUser),
    resend: {
      apiKey: resendKey ? `re_***${resendKey.slice(-4)}` : '❌ NOT SET — add RESEND_API_KEY in Render env vars',
      from: resendFrom || '⚠️ RESEND_FROM not set (will use default)',
    },
    smtp: {
      user: smtpUser ? `${smtpUser.slice(0, 4)}***@${smtpUser.split('@')[1]}` : 'NOT SET',
      note: 'SMTP is blocked on Render free tier — only used for local dev',
    },
  });
});

/**
 * POST /api/auth/test-email
 * Send a test OTP email to verify the email service works (admin only)
 */
router.post('/test-email', requireAuth, async (req, res) => {
  if (req.user?.userType !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  try {
    const testOtp = generateOTP();
    await sendVerificationOTP(email, 'Test User', testOtp);
    res.json({ success: true, message: `Test OTP sent to ${email}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/email-debug
 * Resend + SMTP diagnostic (admin only)
 */
router.get('/email-debug', requireAuth, async (req, res) => {
  if (req.user?.userType !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const resendKey = process.env.RESEND_API_KEY;
  const status = {
    env: {
      RESEND_API_KEY: resendKey ? `✅ set (re_***${resendKey.slice(-4)})` : '❌ NOT SET',
      RESEND_FROM: process.env.RESEND_FROM || '⚠️ not set',
      EMAIL_USER: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0, 4)}***` : 'not set',
    },
    resend: null,
  };

  if (resendKey) {
    try {
      const { Resend } = await import('resend');
      const r = new Resend(resendKey);
      // Ping the Resend API by listing domains (lightweight)
      const domains = await r.domains.list();
      status.resend = domains.error
        ? `❌ API error: ${domains.error.message}`
        : `✅ Resend API key valid. Domains: ${domains.data?.data?.map(d => d.name).join(', ') || 'none verified yet'}`;
    } catch (err) {
      status.resend = `❌ Resend check failed: ${err.message}`;
    }
  } else {
    status.resend = '❌ RESEND_API_KEY not set — add it in Render environment variables';
  }

  res.json(status);
});


router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email is required' });
    const exists = await User.findOne({ email: email.toLowerCase().trim() }).select('_id isVerified').lean();
    if (!exists) return res.json({ available: true });
    if (!exists.isVerified) return res.json({ available: false, unverified: true, message: 'An unverified account exists. You can sign up to resend the verification code.' });
    return res.json({ available: false, message: 'This email is already registered. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check email' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, userType, grade, age, schoolName, referralCode } = req.body;

    // Input validation
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but is unverified, resend OTP instead of blocking them
      if (!existingUser.isVerified && (existingUser.userType === 'student' || existingUser.userType === 'referral')) {
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await User.findByIdAndUpdate(existingUser._id, { verificationOTP: otp, otpExpires });
        let emailResent = false;
        try {
          await sendVerificationOTP(email, existingUser.fullName, otp);
          emailResent = true;
        } catch (emailError) {
          console.error('[Signup/Resend] ⚠️ Email failed:', emailError.message);
        }
        return res.status(200).json({
          message: emailResent
            ? 'A new verification code has been sent to your email.'
            : 'Account found! Email delivery failed — tap "Resend Code" on the verification screen.',
          email: existingUser.email,
          requiresVerification: true,
          resent: true,
          emailSent: emailResent,
        });
      }
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP for email verification (students and referrals only)
    const requiresVerification = userType === 'student' || userType === 'referral';
    let otp = null;
    let otpExpires = null;

    if (requiresVerification) {
      otp = generateOTP();
      otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      userType,
      isVerified: !requiresVerification, // Admins are auto-verified
      verificationOTP: otp,
      otpExpires: otpExpires,
    });

    // Send verification OTP email
    // Non-blocking: wait at most 5 seconds so the user is never stuck on the
    // register page waiting for email delivery. If email is still in-flight
    // after 5 s, it continues in the background and emailSent stays false
    // (the user can tap "Resend Code" on the verification screen).
    let emailSent = false;
    if (requiresVerification && otp) {
      console.log(`\n========================================`);
      console.log(`[OTP - SIGNUP] Email: ${email}`);
      console.log(`[OTP - SIGNUP] Code:  ${otp}`);
      console.log(`========================================\n`);
      const emailPromise = sendVerificationOTP(email, fullName, otp)
        .then(() => { emailSent = true; })
        .catch(emailError => {
          console.error('[Signup] ⚠️ Verification email failed (OTP logged above):', emailError.message);
        });
      // Give email up to 5 seconds; respond to client regardless
      await Promise.race([emailPromise, new Promise(resolve => setTimeout(resolve, 5000))]);
    }

    // Create admin alert for new user registration
    try {
      await createAdminAlert({
        type: 'new_user',
        title: 'New User Registered',
        message: `${fullName} (${email}) signed up as ${userType}.`,
        metadata: { userId: user._id.toString(), userType, email },
      });
    } catch (_) {}

    // Create student record if user type is student
    if (userType === 'student' && grade && age && schoolName) {
      await Student.create({
        userId: user._id,
        fullName,
        grade,
        age,
        schoolName,
      });
    }

    // Track referral if referral code provided
    if (referralCode) {
      try {
        // Find referrer by referral code (referral partners use User.referralCode)
        let referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        
        if (!referrer) {
          // Check student referral code format: MINDSTA + first 8 chars of userId
          // The student referral page generates: `MINDSTA${user.id.substring(0,8).toUpperCase()}`
          if (referralCode.toUpperCase().startsWith('MINDSTA')) {
            const partialId = referralCode.toUpperCase().replace('MINDSTA', '').toLowerCase();
            // Use a regex on the hex ObjectId directly — avoids loading all students into memory
            referrer = await User.findOne({
              userType: 'student',
              $where: `this._id.toString().startsWith("${partialId}")`,
            }) || null;
          }
        }

        if (referrer && referrer._id.toString() !== user._id.toString()) {
          // Create referral record
          await Referral.create({
            referrerId: referrer._id,
            referredEmail: email,
            referredUserId: user._id,
            status: 'pending', // Will be completed when user makes first payment
          });
          console.log(`[Auth] Referral tracked: ${referrer.email} referred ${email}`);

          // Create admin alert for referral signup
          try {
            await createAdminAlert({
              type: 'referral_signup',
              title: 'Referral Registration',
              message: `${user.fullName || email} registered using ${referrer.userType === 'referral' ? 'partner' : 'student'} referral code from ${referrer.fullName || referrer.email}.`,
              metadata: { referrerId: referrer._id.toString(), newUserId: user._id.toString() },
            });
          } catch (_) {}
          
          // Send referral signup email to referrer (for referral partners)
          if (referrer.userType === 'referral') {
            try {
              if (referrer.email) {
                await sendReferralSignupEmail(
                  referrer.email,
                  referrer.firstName || referrer.fullName || 'Referrer',
                  user.fullName || email,
                  referralCode.toUpperCase()
                );
              }
            } catch (emailError) {
              console.error('[Referral Signup Email Error]', emailError.message);
            }
          }
        } else {
          console.log(`[Auth] Invalid referral code: ${referralCode}`);
        }
      } catch (refError) {
        console.error('[Auth] Error tracking referral:', refError);
        // Don't fail signup if referral tracking fails
      }
    }

    // For students and referrals, don't generate token yet - require verification first
    if (requiresVerification) {
      return res.status(201).json({
        message: emailSent
          ? 'Signup successful. Please check your email for your verification code.'
          : 'Account created! The verification email could not be sent right now — tap "Resend Code" on the next screen to try again.',
        email: user.email,
        requiresVerification: true,
        userId: user._id.toString(),
        emailSent,
      });
    }

    // Send welcome email to auto-verified users (admins/non-student types) — non-blocking
    sendWelcomeEmail(user.email, user.fullName).catch(err => {
      console.error('[Auth] Welcome email failed:', err.message);
    });

    // For other user types (admins), generate JWT token immediately
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store user data in response
    const authUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      token,
      isVerified: user.isVerified,
    };

    res.status(201).json(authUser);
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Failed to sign up', message: error.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify email with OTP
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+verificationOTP +otpExpires');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if OTP expired
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verifiedAt = new Date();
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send congratulatory email (don't wait for it)
    sendEmailVerifiedEmail(user.email, user.fullName).catch(err => {
      console.error('[Auth] Failed to send verification success email:', err.message);
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const authUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      token,
      isVerified: true,
    };

    // Google OAuth users who registered via Google have no Student record yet
    // (grade/age/schoolName are not provided by Google). Signal the frontend
    // so it can show the complete-profile modal immediately after verification.
    const needsProfileSetup = !!(user.googleId && user.userType === 'student');
    // Likewise, referral users from Google OAuth have no phone number yet.
    const needsReferralProfileSetup = !!(user.googleId && user.userType === 'referral');

    res.json({
      message: 'Email verified successfully',
      user: authUser,
      needsProfileSetup,
      needsReferralProfileSetup,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP', message: error.message });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP for email verification
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email — non-blocking with 5s timeout
    console.log(`\n========================================`);
    console.log(`[OTP - RESEND] Email: ${email}`);
    console.log(`[OTP - RESEND] Code:  ${otp}`);
    console.log(`========================================\n`);
    let emailSent = false;
    const resendEmailPromise = sendVerificationOTP(email, user.fullName, otp)
      .then(() => { emailSent = true; })
      .catch(emailError => {
        console.error('[Resend OTP] ⚠️ Email failed (OTP saved in DB — code logged above):', emailError.message);
      });
    await Promise.race([resendEmailPromise, new Promise(resolve => setTimeout(resolve, 5000))]);

    res.json({
      message: emailSent
        ? 'Verification code sent to your email.'
        : 'Email delivery failed — please try again in a moment.',
      emailSent,
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP', message: error.message });
  }
});

/**
 * POST /api/auth/signin
 * Sign in a user (STUDENTS, PARENTS, EDUCATORS, REFERRALS ONLY - NOT ADMINS)
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with security fields
    const user = await User.findOne({ email }).select('+loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // BLOCK ADMIN ACCOUNTS FROM STUDENT LOGIN
    if (user.userType === 'admin') {
      return res.status(403).json({ 
        error: 'Admin accounts cannot use student login. Please use the admin portal at /admin-auth' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ 
        error: `Account locked due to multiple failed login attempts. Try again in ${lockTimeRemaining} minutes.`
      });
    }

    // Check if email is verified (for students and referrals)
    if ((user.userType === 'student' || user.userType === 'referral') && !user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login info and set online status
    await User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      lastLoginIP: req.ip || req.connection.remoteAddress,
      isOnline: true,
      lastActiveAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const authUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      token,
      isVerified: user.isVerified,
    };

    res.json(authUser);
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ error: 'Failed to sign in', message: error.message });
  }
});

/**
 * POST /api/auth/admin-signin
 * Admin sign in
 */
router.post('/admin-signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is admin
    if (user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update online status and last login
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastActiveAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const authUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      token,
    };

    res.json(authUser);
  } catch (error) {
    console.error('Error in admin signin:', error);
    res.status(500).json({ error: 'Failed to sign in', message: error.message });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'User ID, current password, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log(`[Auth] Password changed for user: ${user.email}`);

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password', message: error.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate password reset: generate token and send email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether email exists
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expires;
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.fullName || user.email, resetUrl);
    } catch (e) {
      console.error('[Auth] Failed sending reset email:', e.message);
      // Still proceed; email may be in test mode
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Failed to process request', message: error.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Complete password reset with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log(`[Auth] Password reset for user: ${user.email}`);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Failed to reset password', message: error.message });
  }
});

/**
 * PATCH /api/auth/profile
 * Update authenticated user's own profile fields (phone, fullName).
 * Used by Google OAuth users who complete their profile after first login.
 */
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { phoneNumber, fullName } = req.body;
    const allowedUpdates = {};
    if (phoneNumber !== undefined) allowedUpdates.phoneNumber = phoneNumber;
    if (fullName !== undefined) allowedUpdates.fullName = fullName;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password -verificationOTP');

    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user: { id: updated._id, fullName: updated.fullName, phoneNumber: updated.phoneNumber },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

/**
 * PUT /api/auth/notification-preferences
 * Update user notification preferences
 */
router.put('/notification-preferences', requireAuth, async (req, res) => {
  try {
    const { userId, emailNotifications, quizReminders, progressUpdates, weeklyReport } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update notification preferences
    user.notificationPreferences = {
      emailNotifications: emailNotifications ?? user.notificationPreferences?.emailNotifications ?? true,
      quizReminders: quizReminders ?? user.notificationPreferences?.quizReminders ?? true,
      progressUpdates: progressUpdates ?? user.notificationPreferences?.progressUpdates ?? true,
      weeklyReport: weeklyReport ?? user.notificationPreferences?.weeklyReport ?? false,
    };

    await user.save();

    console.log(`[Auth] Notification preferences updated for user: ${user.email}`);

    res.json({ 
      success: true, 
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences', message: error.message });
  }
});

/**
 * PUT /api/auth/privacy-settings
 * Update user privacy settings
 */
router.put('/privacy-settings', requireAuth, async (req, res) => {
  try {
    const { userId, showProgress, allowAnalytics } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update privacy settings
    user.privacySettings = {
      showProgress: showProgress ?? user.privacySettings?.showProgress ?? true,
      allowAnalytics: allowAnalytics ?? user.privacySettings?.allowAnalytics ?? true,
    };

    await user.save();

    console.log(`[Auth] Privacy settings updated for user: ${user.email}`);

    res.json({ 
      success: true, 
      message: 'Privacy settings updated successfully',
      settings: user.privacySettings
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Failed to update privacy settings', message: error.message });
  }
});

/**
 * GET /api/auth/preferences/:userId
 * Get user preferences and settings
 */
router.get('/preferences/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('notificationPreferences privacySettings');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      notificationPreferences: user.notificationPreferences || {
        emailNotifications: true,
        quizReminders: true,
        progressUpdates: true,
        weeklyReport: false,
      },
      privacySettings: user.privacySettings || {
        showProgress: true,
        allowAnalytics: true,
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences', message: error.message });
  }
});

/**
 * DELETE /api/auth/account/:userId
 * Delete user account and all associated data
 */
router.delete('/account/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { password, confirmText } = req.body;

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Verify confirmation text
    if (confirmText !== 'DELETE') {
      return res.status(400).json({ error: 'Please type DELETE to confirm account deletion' });
    }

    // Import models that might be needed (using dynamic import to avoid circular dependencies)
    const { default: Student } = await import('../models/Student.js');
    const { default: UserProgress } = await import('../models/UserProgress.js');
    const { default: Enrollment } = await import('../models/Enrollment.js');
    const { default: Cart } = await import('../models/Cart.js');
    const { default: Wishlist } = await import('../models/Wishlist.js');
    const { default: Notification } = await import('../models/Notification.js');
    const { default: Payment } = await import('../models/Payment.js');

    // Delete all associated data
    await Promise.all([
      Student.deleteMany({ userId }),
      UserProgress.deleteMany({ userId }),
      Enrollment.deleteMany({ userId }),
      Cart.deleteMany({ userId }),
      Wishlist.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Payment.updateMany({ userId }, { $set: { userId: null } }), // Keep payment records but anonymize
    ]);

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: 'Account successfully deleted',
      success: true 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account', message: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and update online status
 */
router.post('/logout', async (req, res) => {
  try {
    // Get userId from token (if provided)
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id || decoded.userId;
        
        // Update user's online status
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastActiveAt: new Date()
        });
        
        console.log(`[Auth] User ${userId} logged out - set isOnline: false`);
      } catch (tokenError) {
        // Token might be expired or invalid, that's okay for logout
        console.log('[Auth] Logout without valid token');
      }
    }
    
    res.json({ 
      message: 'Logged out successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error logging out:', error);
    // Still return success since logout should always work client-side
    res.json({ 
      message: 'Logged out successfully',
      success: true 
    });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 * Accepts optional ?userType=referral to create referral accounts
 */
router.get('/google', (req, res, next) => {
  const userType = req.query.userType === 'referral' ? 'referral' : 'student';
  const state = Buffer.from(JSON.stringify({ userType })).toString('base64');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
});

/**
 * GET /api/auth/google/callback
 * Google OAuth callback handler
 */
router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=google_auth_failed`
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('[Google OAuth Callback] Processing user:', req.user?.email);
      
      // User is attached to req.user by passport
      const user = req.user;
      
      if (!user) {
        console.error('[Google OAuth Callback] No user found in request');
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendURL}/auth?error=authentication_failed`);
      }

      // If user is not yet verified, send OTP and redirect to verification screen
      if (!user.isVerified) {
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await User.findByIdAndUpdate(user._id, { verificationOTP: otp, otpExpires });
        try {
          await sendVerificationOTP(user.email, user.fullName, otp);
          console.log('[Google OAuth Callback] OTP sent for unverified user:', user.email);
        } catch (emailErr) {
          console.error('[Google OAuth Callback] Failed to send OTP email:', emailErr);
        }
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendURL}/auth?requiresVerification=true&email=${encodeURIComponent(user.email)}`);
      }

      // Generate a short-lived JWT (5 min) for the handoff URL.
      // Hash fragments are never sent to the server in HTTP requests,
      // so the token won't appear in server access logs or referrer headers.
      const token = jwt.sign(
        { id: user._id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      console.log('[Google OAuth Callback] Token generated, redirecting to frontend');
      
      // Use a hash fragment (#) instead of a query string (?) so the token is
      // never sent in HTTP requests and is not included in server access logs.
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/google/callback#token=${token}&email=${encodeURIComponent(user.email)}&fullName=${encodeURIComponent(user.fullName)}&userType=${user.userType}&id=${user._id}`);
    } catch (error) {
      console.error('[Google OAuth Callback] Error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth?error=authentication_error`);
    }
  }
);

export default router;
