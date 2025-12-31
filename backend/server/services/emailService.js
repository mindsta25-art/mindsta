/**
 * Email Service
 * Handles all email notifications for the Mindsta app
 */

import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Mindsta <noreply@mindsta.com>';

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // If credentials not provided, use ethereal email for testing
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      console.warn('  Email credentials not configured. Using test mode.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

/**
 * Send email helper function
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = getTransporter();
    
    // If no transporter (test mode), just log
    if (!transport) {
      console.log('📧 [EMAIL TEST MODE]', { to, subject });
      console.log('Content:', text || html);
      return { success: true, testMode: true };
    }

    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(' Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(' Email send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Payment Success Email
 */
export const sendPaymentSuccessEmail = async (student, payment) => {
  const subject = '🎉 Payment Successful - Welcome to Mindsta!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Payment Successful!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hi <strong>${student.fullName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Thank you for your payment! Your account has been activated and you now have full access to all Mindsta learning materials.
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Payment Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Amount:</strong> ₦${(payment.amount / 100).toLocaleString()}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Reference:</strong> ${payment.reference}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Start Learning Now
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          If you have any questions, please contact us at 
          <a href="mailto:support@mindsta.com" style="color: #667eea;">support@mindsta.com</a>
        </p>
      </div>
    </div>
  `;
  
  const text = `
    Payment Successful!
    
    Hi ${student.fullName},
    
    Thank you for your payment! Your account has been activated and you now have full access to all Mindsta learning materials.
    
    Payment Details:
    Amount: ₦${(payment.amount / 100).toLocaleString()}
    Reference: ${payment.reference}
    Date: ${new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
    
    Start learning at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
    
    If you have any questions, contact us at support@mindsta.com
  `;

  return sendEmail({ to: student.email, subject, html, text });
};

/**
 * Referral Signup Email (to referrer)
 */
export const sendReferralSignupEmail = async (referrer, referredUser) => {
  const subject = '🎊 New Referral Signup!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">New Referral Signup!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hi <strong>${referrer.fullName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Great news! Someone just signed up using your referral link.
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Referral Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${referredUser.email}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>💰 Earning Potential:</strong> You'll earn a commission when this user makes their first payment!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/referral/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            View Referral Dashboard
          </a>
        </div>
      </div>
    </div>
  `;
  
  const text = `
    New Referral Signup!
    
    Hi ${referrer.fullName},
    
    Great news! Someone just signed up using your referral link.
    
    Referral Details:
    Email: ${referredUser.email}
    Date: ${new Date().toLocaleDateString()}
    
    You'll earn a commission when this user makes their first payment!
    
    View your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/referral/dashboard
  `;

  return sendEmail({ to: referrer.email, subject, html, text });
};

/**
 * Commission Earned Email (to referrer)
 */
export const sendCommissionEarnedEmail = async (referrer, commission, payment) => {
  const subject = ' You Earned a Commission!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">💰 Commission Earned!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hi <strong>${referrer.fullName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Congratulations! You've earned a commission from a successful referral payment.
        </p>
        
        <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #92400e; margin: 0;">Commission Amount</p>
          <p style="font-size: 36px; font-weight: bold; color: #f59e0b; margin: 10px 0;">₦${commission.commissionAmount.toLocaleString()}</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Payment Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Payment Amount:</strong> ₦${payment.amount.toLocaleString()}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Your Commission:</strong> ₦${commission.commissionAmount.toLocaleString()}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Status:</strong> Pending Payout</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/referral/settings" 
             style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Request Payout
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Keep sharing your referral link to earn more commissions!
        </p>
      </div>
    </div>
  `;
  
  const text = `
    Commission Earned!
    
    Hi ${referrer.fullName},
    
    Congratulations! You've earned a commission from a successful referral payment.
    
    Commission Amount: ₦${commission.commissionAmount.toLocaleString()}
    
    Payment Details:
    Payment Amount: ₦${payment.amount.toLocaleString()}
    Your Commission: ₦${commission.commissionAmount.toLocaleString()}
    Status: Pending Payout
    
    Request payout: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/referral/settings
  `;

  return sendEmail({ to: referrer.email, subject, html, text });
};

/**
 * Payout Request Email (to admin)
 */
export const sendPayoutRequestEmail = async (referrer, amount) => {
  const subject = '💸 New Payout Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New Payout Request</h2>
      <p><strong>Referrer:</strong> ${referrer.fullName} (${referrer.email})</p>
      <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/referral-payouts">View Pending Payouts</a></p>
    </div>
  `;
  
  const text = `
    New Payout Request
    
    Referrer: ${referrer.fullName} (${referrer.email})
    Amount: ₦${amount.toLocaleString()}
    Date: ${new Date().toLocaleString()}
    
    View pending payouts: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/referral-payouts
  `;

  // Send to admin email
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
  return sendEmail({ to: adminEmail, subject, html, text });
};

/**
 * Payout Processed Email (to referrer)
 */
export const sendPayoutProcessedEmail = async (referrer, payout) => {
  const subject = '✅ Payout Processed Successfully';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payout Processed!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hi <strong>${referrer.fullName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Good news! Your payout request has been processed successfully.
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Payout Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Amount:</strong> ₦${payout.amount.toLocaleString()}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Bank:</strong> ${payout.bankName}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Account:</strong> ${payout.accountNumber}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">
          The funds should reflect in your account within 1-3 business days.
        </p>
      </div>
    </div>
  `;
  
  const text = `
    Payout Processed!
    
    Hi ${referrer.fullName},
    
    Good news! Your payout request has been processed successfully.
    
    Payout Details:
    Amount: ₦${payout.amount.toLocaleString()}
    Bank: ${payout.bankName}
    Account: ${payout.accountNumber}
    Date: ${new Date().toLocaleDateString()}
    
    The funds should reflect in your account within 1-3 business days.
  `;

  return sendEmail({ to: referrer.email, subject, html, text });
};

/**
 * Password Reset Email (to user)
 */
export const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const subject = 'Reset your Mindsta password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; color: #374151;">Hi <strong>${userName || 'there'}</strong>,</p>
        <p style="font-size: 15px; color: #374151; line-height: 1.6;">We received a request to reset your Mindsta password. Click the button below to choose a new password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  const text = `
    Password Reset Request

    Hi ${userName || 'there'},

    We received a request to reset your Mindsta password. Use the link below to choose a new password. This link will expire in 1 hour.

    ${resetUrl}

    If you didn't request this, you can ignore this email.
  `;

  return sendEmail({ to: toEmail, subject, html, text });
};

export default {
  sendPaymentSuccessEmail,
  sendReferralSignupEmail,
  sendCommissionEarnedEmail,
  sendPayoutRequestEmail,
  sendPayoutProcessedEmail,
  sendPasswordResetEmail,
};
