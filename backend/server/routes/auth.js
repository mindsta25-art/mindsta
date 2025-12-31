/**
 * Authentication Routes
 * Handles user signup, signin, and authentication
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Student, Referral } from '../models/index.js';
import { sendReferralSignupEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/signup
 * Sign up a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, userType, grade, age, schoolName, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      userType,
    });

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
        // Find referrer by referral code
        const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        
        if (referrer && referrer.userType === 'referral') {
          // Create referral record
          await Referral.create({
            referrerId: referrer._id,
            referredEmail: email,
            referredUserId: user._id,
            status: 'pending', // Will be completed when user makes first payment
          });
          console.log(`[Auth] Referral tracked: ${referrer.email} referred ${email}`);
          
          // Send referral signup email to referrer
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
        } else {
          console.log(`[Auth] Invalid referral code: ${referralCode}`);
        }
      } catch (refError) {
        console.error('[Auth] Error tracking referral:', refError);
        // Don't fail signup if referral tracking fails
      }
    }

    // Generate JWT token
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
    };

    res.status(201).json(authUser);
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Failed to sign up', message: error.message });
  }
});

/**
 * POST /api/auth/signin
 * Sign in a user (STUDENTS, PARENTS, EDUCATORS, REFERRALS ONLY - NOT ADMINS)
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // BLOCK ADMIN ACCOUNTS FROM STUDENT LOGIN
    if (user.userType === 'admin') {
      return res.status(403).json({ 
        error: 'Admin accounts cannot use student login. Please use the admin portal at /admin-auth' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

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
router.post('/change-password', async (req, res) => {
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

export default router;
