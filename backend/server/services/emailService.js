/**
 * Email Service — Resend (HTTP/443) primary, Nodemailer SMTP local-dev fallback
 *
 * Why Resend?  Render free tier blocks all outbound SMTP (ports 465 & 587).
 * Resend sends over HTTPS (port 443) — never blocked by any cloud provider.
 *
 * Setup (one-time):
 *  1. Create free account at https://resend.com
 *  2. Add & verify your domain (mindsta.com.ng) — takes ~5 min
 *  3. Create an API key
 *  4. Add to Render env vars:
 *       RESEND_API_KEY=re_xxxxxxxxxxxx
 *       RESEND_FROM=Mindsta <noreply@mindsta.com.ng>
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ── Resend client (production / staging) ──────────────────────────────────
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

if (resendClient) {
  console.log('[Email] ✅ Resend client ready (HTTP-based — works on Render)');
} else {
  console.warn('[Email] ⚠️  RESEND_API_KEY not set — falling back to Nodemailer SMTP (local dev only)');
}

// FROM address:
// - Resend without verified domain: use onboarding@resend.dev (Resend shared sender, no setup needed)
// - Resend with verified domain: set RESEND_FROM=Mindsta <noreply@mindsta.com.ng> in env vars
// - Gmail SMTP: MUST be the authenticated Gmail account address
const FROM_ADDRESS = resendClient
  ? (process.env.RESEND_FROM || 'Mindsta <onboarding@resend.dev>')
  : (process.env.EMAIL_USER ? `Mindsta <${process.env.EMAIL_USER}>` : 'Mindsta <onboarding@resend.dev>');

console.log(`[Email] 📬 Sending from: ${FROM_ADDRESS}`);

// ── Nodemailer (local dev fallback only) ──────────────────────────────────
const createLocalTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;
  // Google app-specific passwords are displayed with spaces for readability
  // (e.g. "svwf rdge zvug twsf") but must be sent without spaces to SMTP auth.
  const cleanPass = pass.replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass: cleanPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
};

const localTransporter = !resendClient ? createLocalTransporter() : null;

// ── Core send function ─────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html, text, from }) => {
  const fromAddr = from || FROM_ADDRESS;

  // 1️⃣  Resend — HTTP API (works on any platform)
  if (resendClient) {
    const result = await resendClient.emails.send({
      from: fromAddr,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
    if (result.error) {
      throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
    }
    return { messageId: result.data?.id || 'resend-ok' };
  }

  // 2️⃣  Nodemailer fallback (local dev only — SMTP blocked in production)
  if (localTransporter) {
    const info = await localTransporter.sendMail({ from: fromAddr, to, subject, html, text });
    return info;
  }

  throw new Error(
    'Email service not configured. Set RESEND_API_KEY in Render environment variables.'
  );
};

const sendMailWithRetry = async (mailOptions, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await sendMail(mailOptions);
      console.log(`[Email] ✅ Email sent to ${mailOptions.to} (id: ${info.messageId})`);
      return { success: true, message: 'Email sent successfully', messageId: info.messageId };
    } catch (error) {
      console.error(`[Email] ❌ Attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        return { success: false, message: 'Email sending failed after retries', error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

/**
 * Send email verification success congratulations
 * @param {string} email - User's email
 * @param {string} name - User's name
 */
export const sendEmailVerifiedEmail = async (email, name) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:52px;line-height:1;margin-bottom:16px;">🎉</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Email Verified!</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">Your account is now fully activated</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
          Welcome to <strong>Mindsta</strong>! Your email has been verified and you now have full access to all features. Your learning journey starts here.
        </p>
        <!-- Feature grid (2×2) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td width="50%" style="padding:0 6px 10px 0;vertical-align:top;">
              <div style="background:#f0f4ff;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:22px;">📚</p>
                <p style="margin:0 0 4px;color:#1e40af;font-weight:700;font-size:13px;">Browse Lessons</p>
                <p style="margin:0;color:#6b7280;font-size:12px;">Grade 1–6 &amp; Common Entrance</p>
              </div>
            </td>
            <td width="50%" style="padding:0 0 10px 6px;vertical-align:top;">
              <div style="background:#f0fdf4;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:22px;">🎯</p>
                <p style="margin:0 0 4px;color:#065f46;font-weight:700;font-size:13px;">Track Progress</p>
                <p style="margin:0;color:#6b7280;font-size:12px;">Detailed analytics &amp; insights</p>
              </div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:0 6px 0 0;vertical-align:top;">
              <div style="background:#fefce8;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:22px;">💰</p>
                <p style="margin:0 0 4px;color:#713f12;font-weight:700;font-size:13px;">Refer &amp; Earn</p>
                <p style="margin:0;color:#6b7280;font-size:12px;">Share your code, earn commissions</p>
              </div>
            </td>
            <td width="50%" style="padding:0 0 0 6px;vertical-align:top;">
              <div style="background:#fdf4ff;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px;font-size:22px;">🏆</p>
                <p style="margin:0 0 4px;color:#701a75;font-weight:700;font-size:13px;">Earn Rewards</p>
                <p style="margin:0;color:#6b7280;font-size:12px;">Challenges, badges &amp; leaderboard</p>
              </div>
            </td>
          </tr>
        </table>
        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="https://mindsta.com.ng" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">Start Learning Now →</a>
        </div>
        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Questions? <a href="mailto:support@mindsta.com.ng" style="color:#6366f1;text-decoration:none;">support@mindsta.com.ng</a></p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · Empowering minds through quality education</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;

  const textContent = `
Hi ${name},

🎉 Congratulations! Your Email is Verified

Welcome to Mindsta! Your email has been successfully verified and your account is now fully activated.

✨ Your Learning Journey Starts Now!
You now have full access to all Mindsta features.

What You Can Do:

📚 Explore lessons
   Browse our comprehensive library of subjects and lessons

🎯 Track Your Progress
   Monitor your performance with detailed analytics and reports

📝 Take Quizzes
   Test your knowledge and earn certificates

💰 Refer Friends
   Share your referral code and earn commissions on purchases

🏆 Earn Rewards
   Complete challenges and climb the leaderboard

Start learning at: https://mindsta.com.ng

💡 Pro Tip: Complete your profile to get personalized course recommendations and track your progress more effectively!

If you have any questions or need assistance, our support team is always here to help.

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  try {
    const mailOptions = {
      from: FROM_ADDRESS,
      to: email,
      subject: 'Your Email is Verified – Welcome to Mindsta!',
      text: textContent,
      html: htmlContent
    };
    await sendMail(mailOptions);
    console.log(`[Email] ✅ Email verified congratulations sent to ${email}`);
    return Promise.resolve({ success: true, message: 'Email verified congratulations sent successfully' });
  } catch (error) {
    console.error(`[Email] ❌ Failed to send email verified congratulations:`, error.message);
    return Promise.resolve({ success: false, message: 'Email sending failed', error: error.message });
  }
};

/**
 * Send referral signup notification email
 * @param {string} referrerEmail - Email of the referrer
 * @param {string} referrerName - Name of the referrer
 * @param {string} referredName - Name of the person who signed up
 * @param {string} referralCode - The referral code used
 */
export const sendReferralSignupEmail = async (referrerEmail, referrerName, referredName, referralCode) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:48px;line-height:1;margin-bottom:16px;">🎉</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">New Referral Signup!</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">Someone joined via your referral link</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${referrerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
          Great news! Someone just joined Mindsta using your referral code.
        </p>
        <!-- New user box -->
        <div style="background:#f0f4ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">New Member</p>
          <p style="margin:0 0 8px;color:#1e40af;font-size:22px;font-weight:800;">${referredName}</p>
          <div style="display:inline-block;background:#e0e7ff;border-radius:6px;padding:6px 16px;">
            <p style="margin:0;color:#4338ca;font-size:13px;font-weight:600;">Code used: <strong>${referralCode}</strong></p>
          </div>
        </div>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">
            💰 <strong>You'll earn a commission</strong> when ${referredName} makes their first purchase. Keep sharing your code to unlock more earnings!
          </p>
        </div>
        <div style="text-align:center;">
          <a href="https://mindsta.com.ng/referral/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">View Referral Dashboard →</a>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;

  const textContent = `
Hi ${referrerName},

Great news! ${referredName} just joined Mindsta using your referral code (${referralCode}).

You'll earn a commission when they make their first purchase.

View your dashboard: https://mindsta.com.ng/referral/dashboard

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  try {
    const mailOptions = {
      from: FROM_ADDRESS,
      to: referrerEmail,
      subject: 'New Referral Signup – Mindsta',
      text: textContent,
      html: htmlContent
    };
    await sendMail(mailOptions);
    console.log(`[Email] ✅ Referral signup notification sent to ${referrerEmail}`);
    return Promise.resolve({ success: true, message: 'Referral signup email sent successfully' });
  } catch (error) {
    console.error(`[Email] ❌ Failed to send referral signup email:`, error.message);
    return Promise.resolve({ success: false, message: 'Email sending failed', error: error.message });
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} resetUrl - Password reset URL with token
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:48px;line-height:1;margin-bottom:16px;">🔒</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Reset Your Password</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">We received a password reset request</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
          We received a request to reset the password for your Mindsta account. Click the button below to choose a new password.
        </p>
        <!-- CTA button -->
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">Reset Password →</a>
        </div>
        <!-- Fallback URL -->
        <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">Or copy and paste this link into your browser:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin-bottom:24px;word-break:break-all;">
          <a href="${resetUrl}" style="color:#6366f1;font-size:12px;text-decoration:none;">${resetUrl}</a>
        </div>
        <!-- Security notice -->
        <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 4px;color:#991b1b;font-weight:700;font-size:14px;">⚠️ Security Notice</p>
          <p style="margin:0;color:#7f1d1d;font-size:13px;line-height:1.6;">
            This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
          </p>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
    `;

  const textContent = `
Hi ${name},

We received a request to reset your Mindsta password.

Reset your password here:
${resetUrl}

This link expires in 1 hour.

If you did not request this, please ignore this email.

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  const mailOptions = {
    from: FROM_ADDRESS,
    to: email,
    subject: '🔒 Reset Your Password - Mindsta',
    text: textContent,
    html: htmlContent
  };

  return sendMailWithRetry(mailOptions);
  } catch (error) {
    console.error(`[Email] ❌ Failed to send password reset email:`, error.message);
    return Promise.resolve({ success: false, message: 'Email sending failed', error: error.message });
  }
};

/**
 * Send welcome email to new users
 * @param {string} email - User's email
 * @param {string} name - User's name
 */
export const sendWelcomeEmail = async (email, name) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:52px;line-height:1;margin-bottom:16px;">🎓</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Welcome to Mindsta!</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">Your gateway to quality education</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
          We're thrilled to have you join the <strong>Mindsta</strong> community! You now have access to interactive lessons, quizzes, and learning tools designed to help every student excel.
        </p>
        <!-- Steps -->
        <div style="margin-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:40px;font-size:22px;vertical-align:middle;">🔍</td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <p style="margin:0 0 2px;color:#111827;font-weight:700;font-size:14px;">Explore lessons</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">Browse subjects across Grade 1–6 and Common Entrance</p>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:40px;font-size:22px;vertical-align:middle;">🎯</td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <p style="margin:0 0 2px;color:#111827;font-weight:700;font-size:14px;">Track Your Progress</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">See detailed analytics and quiz scores in your dashboard</p>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:40px;font-size:22px;vertical-align:middle;">💰</td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <p style="margin:0 0 2px;color:#111827;font-weight:700;font-size:14px;">Refer &amp; Earn</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">Share your referral code and earn commission on purchases</p>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:12px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:40px;font-size:22px;vertical-align:middle;">🏆</td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <p style="margin:0 0 2px;color:#111827;font-weight:700;font-size:14px;">Win Rewards</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">Complete quizzes and climb the leaderboard</p>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </div>
        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="https://mindsta.com.ng" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">Explore lessons →</a>
        </div>
        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Need help? Contact us at <a href="mailto:support@mindsta.com.ng" style="color:#6366f1;text-decoration:none;">support@mindsta.com.ng</a></p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · Empowering minds through quality education</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;

  const textContent = `
Hi ${name},

Welcome to Mindsta — your gateway to quality education!

We're thrilled to have you join our community of learners.

Get started:
• Explore lessons — Browse subjects across Grade 1–6 and Common Entrance
• Track Progress — Detailed analytics and quiz scores in your dashboard
• Refer & Earn — Share your code and earn commissions
• Win Rewards — Complete quizzes and climb the leaderboard

Start learning: https://mindsta.com.ng

Need help? Contact us at support@mindsta.com.ng

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  try {
    const mailOptions = {
      from: FROM_ADDRESS,
      to: email,
      subject: 'Welcome to Mindsta – Start Your Learning Journey',
      text: textContent,
      html: htmlContent
    };
    await sendMail(mailOptions);
    console.log(`[Email] ✅ Welcome email sent to ${email}`);
    return Promise.resolve({ success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error(`[Email] ❌ Failed to send welcome email:`, error.message);
    return Promise.resolve({ success: false, message: 'Email sending failed', error: error.message });
  }
};

/**
 * Send payout request email to admin
 * @param {string} referrerEmail - Email of the referrer requesting payout
 * @param {string} referrerName - Name of the referrer
 * @param {number} amount - Payout amount
 */
export const sendPayoutRequestEmail = async (referrerEmail, referrerName, amount) => {
  const formattedAmount = Number(amount).toLocaleString();
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:48px;line-height:1;margin-bottom:16px;">💸</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Payout Request Received</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">We'll process your request within 2–5 business days</p>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${referrerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">Your payout request has been received. Here's a summary:</p>
        <div style="background:#f0f4ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Requested Amount</p>
          <p style="margin:0;color:#6366f1;font-size:36px;font-weight:800;">₦${formattedAmount}</p>
        </div>
        <div style="background:#fef9c3;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;color:#713f12;font-size:14px;line-height:1.6;">
            ⏳ <strong>Processing Time:</strong> Our team will review and process your request within 2–5 business days. You'll receive an email confirmation once payment is sent.
          </p>
        </div>
        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Thank you for being a valued Mindsta partner! 🙏</p>
      </td></tr>
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;
  return sendMailWithRetry({
    from: process.env.EMAIL_FROM || FROM_ADDRESS,
    to: referrerEmail,
    subject: 'Payout Request Received – Mindsta',
    html: htmlContent,
  });
};

/**
 * Send payout processed confirmation email
 * @param {string} referrerEmail - Email of the referrer
 * @param {string} referrerName - Name of the referrer
 * @param {number} amount - Payout amount
 */
export const sendPayoutProcessedEmail = async (referrerEmail, referrerName, amount) => {
  const formattedAmount = Number(amount).toLocaleString();
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:52px;line-height:1;margin-bottom:16px;">✅</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Payout Processed!</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">Your funds are on their way</p>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${referrerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">Your payout has been successfully processed and sent to your registered bank account.</p>
        <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Amount Sent</p>
          <p style="margin:0;color:#ffffff;font-size:36px;font-weight:800;">₦${formattedAmount}</p>
        </div>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">
            💳 Please allow <strong>1–3 business days</strong> for the funds to reflect in your account depending on your bank.
          </p>
        </div>
        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Keep referring and earning with Mindsta! 🚀</p>
      </td></tr>
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;
  return sendMailWithRetry({
    from: process.env.EMAIL_FROM || FROM_ADDRESS,
    to: referrerEmail,
    subject: '✅ Your Payout Has Been Processed – Mindsta',
    html: htmlContent,
  });
};

/**
 * Send payment success email to user
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {object} paymentDetails - Payment details
 */
export const sendPaymentSuccessEmail = async (email, name, paymentDetails) => {
  const { amount, reference, items = [], date = new Date().toLocaleDateString() } = paymentDetails;
  
  const itemRows = items.map(item => {
    const courseName = item.name || `${item.subject || 'Course'} - Grade ${item.grade || ''} Term ${item.term || ''}`;
    const price = (item.price || 0).toLocaleString();
    return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">
        <strong>${courseName}</strong><br>
        <span style="color:#9ca3af;font-size:12px;">${item.description || `Grade ${item.grade || ''} ${item.term ? '· ' + item.term : ''}`}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#10b981;font-weight:700;font-size:14px;white-space:nowrap;">₦${price}</td>
    </tr>
  `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:52px;line-height:1;margin-bottom:16px;">✅</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Payment Successful!</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">Your lessons are now unlocked</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
          Thank you for your purchase! Your payment has been confirmed and your course${items.length !== 1 ? 's are' : ' is'} now accessible in your dashboard.
        </p>
        <!-- Receipt -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px;color:#111827;font-size:16px;">&#x1F9FE; Payment Receipt</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Reference</td>
              <td style="padding:6px 0;text-align:right;color:#374151;font-size:13px;font-weight:600;">${reference || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Date</td>
              <td style="padding:6px 0;text-align:right;color:#374151;font-size:13px;font-weight:600;">${date}</td>
            </tr>
          </table>
          ${items.length > 0 ? `
          <div style="border-top:1px solid #e5e7eb;padding-top:12px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Items Purchased</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>
          </div>` : ''}
          <!-- Total -->
          <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:8px;padding:14px 20px;margin-top:16px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="color:rgba(255,255,255,0.9);font-size:14px;">Total Paid</td>
              <td style="text-align:right;color:#ffffff;font-size:20px;font-weight:800;">₦${(amount || 0).toLocaleString()}</td>
            </tr></table>
          </div>
        </div>
        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="https://mindsta.com.ng/my-learning" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">Go to My Learning →</a>
        </div>
        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Happy learning! 🎓</p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;

  const textContent = `
Hi ${name},

Thank you for your payment! Your transaction has been processed successfully.

Payment Receipt
Date: ${date}
Reference: ${reference || 'N/A'}
${items.length > 0 ? '\nPurchased lessons:\n' + items.map(item => {
  const courseName = item.name || `${item.subject || 'Course'} - Grade ${item.grade || ''} Term ${item.term || ''}`;
  return `- ${courseName}: ₦${(item.price || 0).toLocaleString()}`;
}).join('\n') : ''}

Total Amount Paid: ₦${(amount || 0).toLocaleString()}

Your course${items.length > 1 ? 's are' : ' is'} now accessible in your dashboard.
Happy learning! 🎓

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  const mailOptions = {
    from: FROM_ADDRESS,
    to: email,
    subject: '✅ Payment Successful - Mindsta',
    text: textContent,
    html: htmlContent
  };

  return sendMailWithRetry(mailOptions);
};

/**
 * Send commission earned email to referrer
 * @param {string} referrerEmail - Email of the referrer
 * @param {string} referrerName - Name of the referrer
 * @param {number} commission - Commission amount earned
 * @param {object} details - Additional details about the commission
 */
export const sendCommissionEarnedEmail = async (referrerEmail, referrerName, commission, details = {}) => {
  const { referredName = 'A user', totalEarnings = commission } = details;
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:48px;line-height:1;margin-bottom:16px;">💰</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Commission Earned!</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:15px;">A referral purchase just earned you money</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${referrerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
          Congratulations! <strong>${referredName}</strong> made a purchase and you've just earned a commission.
        </p>
        <!-- Earnings display -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td width="50%" style="padding:0 6px 0 0;vertical-align:top;">
              <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:20px;text-align:center;">
                <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Commission Earned</p>
                <p style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">₦${commission.toLocaleString()}</p>
              </div>
            </td>
            <td width="50%" style="padding:0 0 0 6px;vertical-align:top;">
              <div style="background:#f0f4ff;border-radius:12px;padding:20px;text-align:center;">
                <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Earnings</p>
                <p style="margin:0;color:#6366f1;font-size:28px;font-weight:800;">₦${totalEarnings.toLocaleString()}</p>
              </div>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6;">
          Keep sharing your referral code to earn more! You can request a payout once you reach the minimum threshold.
        </p>
        <div style="text-align:center;">
          <a href="https://mindsta.com.ng/referral/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">View Earnings Dashboard →</a>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;

  const textContent = `
Hi ${referrerName},

Congratulations! You've just earned a commission from a referral purchase.

💰 New Commission: ₦${commission.toLocaleString()}

Details:
- Referred User: ${referredName}
- Commission Earned: ₦${commission.toLocaleString()}
- Total Earnings: ₦${totalEarnings.toLocaleString()}

Keep sharing your referral code to earn more commissions!
You can request a payout once you reach the minimum threshold.

View your dashboard: https://mindsta.com.ng/referral/dashboard

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  try {
    const mailOptions = {
      from: FROM_ADDRESS,
      to: referrerEmail,
      subject: 'Commission Earned – Mindsta Referral Program',
      text: textContent,
      html: htmlContent
    };
    await sendMail(mailOptions);
    console.log(`[Email] ✅ Commission earned email sent to ${referrerEmail}`);
    return Promise.resolve({ success: true, message: 'Commission earned email sent successfully' });
  } catch (error) {
    console.error(`[Email] ❌ Failed to send commission earned email:`, error.message);
    return Promise.resolve({ success: false, message: 'Email sending failed', error: error.message });
  }
};

/**
 * Send OTP verification email
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP code
 */
export const sendVerificationOTP = async (email, name, otp) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your Mindsta verification code — do not share it with anyone.</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:44px 36px;text-align:center;">
        <div style="font-size:48px;line-height:1;margin-bottom:16px;">&#10003;</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Verify Your Email</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">One step away from starting your journey</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 36px 30px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
          To complete your registration on <strong>Mindsta</strong>, please use the verification code below. It is valid for <strong>10 minutes</strong>.
        </p>
        <!-- OTP Code Box -->
        <div style="background:#f0f4ff;border:2px dashed #6366f1;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
          <p style="margin:0 0 16px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
            <tr>
              ${otp.toString().split('').map(d => `<td style="padding:0 4px;"><div style="width:44px;height:54px;background:#ffffff;border:2px solid #6366f1;border-radius:10px;display:inline-block;line-height:54px;text-align:center;font-size:28px;font-weight:800;color:#4f46e5;box-shadow:0 2px 8px rgba(99,102,241,0.15);">${d}</div></td>`).join('')}
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;">Expires in 10 minutes &nbsp;·&nbsp; Do not share this code with anyone</p>
        </div>
        <p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.6;">
          Enter this code on the verification page to activate your account.
        </p>
        <p style="margin:0;color:#ef4444;font-size:13px;">
          ⚠️ If you did not create a Mindsta account, please ignore this email.
        </p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta · All rights reserved</p>
        <p style="margin:0;color:#d1d5db;font-size:11px;">This is an automated email — do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
  `;

  const textContent = `
Hi ${name},

Verify your Mindsta account with this code: ${otp}

This code is valid for 10 minutes.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  // Always log OTP to server console for emergency recovery
  console.log(`[Email] ========================================`);
  console.log(`[Email] VERIFICATION OTP`);
  console.log(`[Email] To: ${email} | OTP: ${otp}`);
  console.log(`[Email] ========================================`);

  const mailOptions = {
    from: FROM_ADDRESS,
    to: email,
    subject: 'Verify Your Email - Mindsta',
    text: textContent,
    html: htmlContent
  };

  // Throws on failure — caught by signup route which then deletes the pending user
  await sendMail(mailOptions);
  console.log(`[Email] ✅ Verification OTP sent successfully to ${email}`);
  return { success: true, message: 'OTP email sent successfully' };
};

/**
 * Send newsletter email to subscribers
 * @param {string} email - Subscriber's email
 * @param {string} name - Subscriber's name
 * @param {string} subject - Email subject
 * @param {string} message - Email body content
 */
export const sendNewsletterEmail = async (email, name, subject, message) => {
  const firstName = (name || 'Subscriber').split(' ')[0];
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#6366f1;">Mindsta</p>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.09);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:40px 36px;text-align:center;">
        <p style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:800;">Mindsta</p>
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${subject}</h1>
      </td></tr>
      <!-- Content -->
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${firstName}</strong>,</p>
        <div style="color:#4b5563;font-size:15px;line-height:1.7;white-space:pre-wrap;margin-bottom:28px;">${message}</div>
        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${process.env.FRONTEND_URL || 'https://mindsta.com.ng'}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.35);">Visit Mindsta &rarr;</a>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 36px;text-align:center;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">You're receiving this because you subscribed to the Mindsta newsletter.</p>
        <p style="margin:0 0 12px;">
          <a href="${process.env.FRONTEND_URL || 'https://mindsta.com.ng'}/unsubscribe" style="color:#6366f1;font-size:13px;text-decoration:none;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="mailto:support@mindsta.com.ng" style="color:#6366f1;font-size:13px;text-decoration:none;">Contact Support</a>
        </p>
        <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta &nbsp;·&nbsp; Empowering minds through quality education</p>
      </td></tr>
    </table>
  </td></tr>
</table>
      </body>
      </html>
    `;

    const plainText = `
Hi ${firstName},

${subject}

${message}

Visit Mindsta: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

---
You're receiving this because you subscribed to Mindsta newsletter.
Manage your preferences or unsubscribe at any time.

© ${new Date().getFullYear()} Mindsta. All rights reserved.
    `.trim();

    const mailOptions = {
      from: FROM_ADDRESS,
      to: email,
      subject: subject,
      text: plainText,
      html: htmlContent,
    };

    await sendMailWithRetry(mailOptions);
    console.log(`[Email] ✅ Newsletter sent to: ${email}`);
    
    return Promise.resolve({
      success: true,
      message: 'Newsletter sent successfully'
    });
  } catch (error) {
    console.error(`[Email] ❌ Failed to send newsletter to ${email}:`, error.message);
    throw error;
  }
};

/**
 * Send abandoned cart reminder email
 * @param {string} email - User's email
 * @param {string} name - User's full name
 * @param {Array}  items - Cart items [{ title, subject, grade, price }]
 * @param {number} totalAmount - Total cart value in Naira
 */
export const sendAbandonedCartEmail = async (email, name, items = [], totalAmount = 0) => {
  const firstName = (name || 'there').split(' ')[0];
  const cartUrl = `${process.env.FRONTEND_URL || 'https://mindsta.com.ng'}/cart`;

  const itemRows = items.slice(0, 5).map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
        <strong style="color:#1a202c;">${item.title || item.subject || 'Course'}</strong><br>
        <span style="color:#718096;font-size:13px;">${item.subject || ''}${item.grade ? ' · Grade ' + item.grade : ''}${item.term ? ' · ' + item.term : ''}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#10b981;font-weight:bold;white-space:nowrap;">
        ₦${(item.price || 0).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fa;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:35px 30px;text-align:center;">
          <p style="color:#fff;font-size:26px;font-weight:700;margin:0;">Mindsta</p>
          <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">You left something behind!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Your cart is waiting for you</p>
        </div>

        <!-- Body -->
        <div style="padding:35px 30px;">
          <p style="color:#2d3748;font-size:16px;margin:0 0 20px;">Hi <strong>${firstName}</strong>,</p>
          <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 25px;">
            Great news — the lessons in your cart are still available! 
            You're just one step away from unlocking quality lessons for your studies.
          </p>

          <!-- Cart items -->
          <div style="background:#f7fafc;border-radius:10px;padding:20px 25px;margin-bottom:25px;">
            <h3 style="margin:0 0 15px;color:#1a202c;font-size:16px;">🛒 Your Cart</h3>
            <table style="width:100%;border-collapse:collapse;">
              ${itemRows}
              <tr>
                <td style="padding:12px 0 0;font-weight:700;color:#1a202c;font-size:16px;">Total</td>
                <td style="padding:12px 0 0;text-align:right;font-weight:700;color:#6366f1;font-size:18px;">₦${totalAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${cartUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);color:#fff;text-decoration:none;padding:16px 48px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 10px rgba(99,102,241,0.35);">
              Complete My Purchase →
            </a>
          </div>

          <p style="color:#718096;font-size:14px;text-align:center;margin:0;">
            Questions? <a href="https://mindsta.com.ng/help" style="color:#6366f1;text-decoration:none;">Visit our Help Centre</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:24px 30px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:13px;margin:0 0 6px;">
            You received this because you have items in your Mindsta cart.
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Mindsta &nbsp;·&nbsp; <a href="mailto:support@mindsta.com.ng" style="color:#6366f1;text-decoration:none;">support@mindsta.com.ng</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${firstName},

You left something in your Mindsta cart!

Your items:
${items.slice(0, 5).map(i => `- ${i.title || i.subject}: ₦${(i.price || 0).toLocaleString()}`).join('\n')}

Total: ₦${totalAmount.toLocaleString()}

Complete your purchase: ${cartUrl}

© ${new Date().getFullYear()} Mindsta. All rights reserved.
  `.trim();

  return sendMailWithRetry({
    from: FROM_ADDRESS,
    to: email,
    subject: '🛒 You left something in your cart — Mindsta',
    text: textContent,
    html: htmlContent,
  });
};
