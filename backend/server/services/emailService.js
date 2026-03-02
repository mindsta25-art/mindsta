/**
 * Email Service
 * Professional mailing system using Nodemailer
 * Supports Gmail, Outlook, custom SMTP, and other providers
 */

import pkg from 'nodemailer';
const { createTransport } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Email service configuration
const EMAIL_CONFIG = {
  // Service provider (gmail, outlook, yahoo, etc.)
  service: process.env.EMAIL_SERVICE || null,
  // SMTP configuration
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  // Authentication
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Additional options
  pool: process.env.EMAIL_POOL === 'true', // Use connection pool
  maxConnections: parseInt(process.env.EMAIL_MAX_CONNECTIONS) || 5,
  maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES) || 100,
  rateDelta: parseInt(process.env.EMAIL_RATE_DELTA) || 1000,
  rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT) || 5,
};

// Create reusable transporter with enhanced configuration
const createTransporter = () => {
  // Validate email configuration
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('[Email] ⚠️  Email credentials not configured. Emails will be logged to console only.');
    console.warn('[Email] Set EMAIL_USER and EMAIL_PASSWORD in .env file');
    return null;
  }

  try {
    const config = {
      ...(EMAIL_CONFIG.service ? { service: EMAIL_CONFIG.service } : {
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
      }),
      auth: EMAIL_CONFIG.auth,
      pool: EMAIL_CONFIG.pool,
      maxConnections: EMAIL_CONFIG.maxConnections,
      maxMessages: EMAIL_CONFIG.maxMessages,
      rateDelta: EMAIL_CONFIG.rateDelta,
      rateLimit: EMAIL_CONFIG.rateLimit,
      // Security options
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    };

    const transporter = createTransport(config);

    // Verify connection on startup
    transporter.verify((error, success) => {
      if (error) {
        console.error('[Email] ❌ SMTP connection error:', error.message);
      } else {
        console.log('[Email] ✅ SMTP server is ready to send emails');
        console.log(`[Email] 📧 Using: ${EMAIL_CONFIG.service || EMAIL_CONFIG.host}`);
      }
    });

    return transporter;
  } catch (error) {
    console.error('[Email] ❌ Failed to create email transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

/**
 * Send email with retry logic and error handling
 * @param {object} mailOptions - Nodemailer mail options
 * @param {number} retries - Number of retry attempts
 * @returns {Promise} - Send result
 */
const sendMailWithRetry = async (mailOptions, retries = 3) => {
  if (!transporter) {
    console.log(`[Email] Email not sent (service not configured)`);
    console.log(`[Email] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
    return Promise.resolve({ 
      success: false, 
      message: 'Email service not configured',
      simulated: true 
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email] ✅ Email sent successfully to ${mailOptions.to}`);
      console.log(`[Email] Message ID: ${info.messageId}`);
      return Promise.resolve({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: info.messageId 
      });
    } catch (error) {
      console.error(`[Email] ❌ Attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        return Promise.resolve({ 
          success: false, 
          message: 'Email sending failed after retries',
          error: error.message 
        });
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
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
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-icon { font-size: 64px; margin: 20px 0; }
        .highlight-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center; }
        .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .feature-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .feature-item:last-child { border-bottom: none; }
        .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">🎉</div>
          <h1 style="margin: 0;">Congratulations!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Your Email is Verified</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p><strong>Welcome to Mindsta!</strong> Your email has been successfully verified and your account is now fully activated.</p>
          
          <div class="highlight-box">
            <h2 style="margin: 0 0 10px 0;">✨ Your Learning Journey Starts Now!</h2>
            <p style="margin: 0; opacity: 0.95;">You now have full access to all Mindsta features</p>
          </div>
          
          <div class="features">
            <h3 style="margin-top: 0; color: #667eea;">What You Can Do:</h3>
            <div class="feature-item">
              <strong>📚 Explore Courses</strong><br>
              <span style="color: #666; font-size: 14px;">Browse our comprehensive library of subjects and lessons</span>
            </div>
            <div class="feature-item">
              <strong>🎯 Track Your Progress</strong><br>
              <span style="color: #666; font-size: 14px;">Monitor your performance with detailed analytics and reports</span>
            </div>
            <div class="feature-item">
              <strong>📝 Take Quizzes</strong><br>
              <span style="color: #666; font-size: 14px;">Test your knowledge and earn certificates</span>
            </div>
            <div class="feature-item">
              <strong>💰 Refer Friends</strong><br>
              <span style="color: #666; font-size: 14px;">Share your referral code and earn commissions on purchases</span>
            </div>
            <div class="feature-item">
              <strong>🏆 Earn Rewards</strong><br>
              <span style="color: #666; font-size: 14px;">Complete challenges and climb the leaderboard</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://mindsta33.vercel.app" class="btn">Start Learning Now</a>
          </div>
          
          <p style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #fbbf24; border-radius: 5px;">
            <strong>💡 Pro Tip:</strong> Complete your profile to get personalized course recommendations and track your progress more effectively!
          </p>
          
          <p style="color: #666;">If you have any questions or need assistance, our support team is always here to help.</p>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${name},

🎉 Congratulations! Your Email is Verified

Welcome to Mindsta! Your email has been successfully verified and your account is now fully activated.

✨ Your Learning Journey Starts Now!
You now have full access to all Mindsta features.

What You Can Do:

📚 Explore Courses
   Browse our comprehensive library of subjects and lessons

🎯 Track Your Progress
   Monitor your performance with detailed analytics and reports

📝 Take Quizzes
   Test your knowledge and earn certificates

💰 Refer Friends
   Share your referral code and earn commissions on purchases

🏆 Earn Rewards
   Complete challenges and climb the leaderboard

Start learning at: https://mindsta33.vercel.app

💡 Pro Tip: Complete your profile to get personalized course recommendations and track your progress more effectively!

If you have any questions or need assistance, our support team is always here to help.

© 2024 Mindsta. All rights reserved.
  `.trim();

  if (!transporter) {
    console.log(`[Email] Email verified congratulations (Email service not configured)`);
    console.log(`[Email] To: ${email} | Name: ${name}`);
    return Promise.resolve({ success: true, message: 'Email logged (not sent - email service not configured)' });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Congratulations! Your Email is Verified - Mindsta',
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
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
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .user-name { font-size: 20px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Referral Signup!</h1>
        </div>
        <div class="content">
          <p>Hi ${referrerName},</p>
          <p>Great news! Someone just signed up using your referral code.</p>
          
          <div class="highlight-box">
            <p style="margin: 0; color: #666;">New User:</p>
            <div class="user-name">${referredName}</div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Used code: <strong>${referralCode}</strong></p>
          </div>
          
          <p>You'll earn commission when they make their first purchase!</p>
          <p>Keep sharing your referral code to earn more rewards.</p>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${referrerName},

Great news! Someone just signed up using your referral code.

New User: ${referredName}
Used code: ${referralCode}

You'll earn commission when they make their first purchase!
Keep sharing your referral code to earn more rewards.

© 2024 Mindsta. All rights reserved.
  `.trim();

  if (!transporter) {
    console.log(`[Email] Referral signup notification (Email service not configured)`);
    console.log(`[Email] To: ${referrerEmail} | Referred: ${referredName} | Code: ${referralCode}`);
    return Promise.resolve({ success: true, message: 'Email logged (not sent - email service not configured)' });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
      to: referrerEmail,
      subject: '🎉 New Referral Signup - Mindsta',
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
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
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .warning { background: #fef2f2; border-left: 4px solid #f43f5e; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your Mindsta account.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #667eea;">${resetUrl}</p>
          
          <div class="warning">
            <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
            <p style="margin: 5px 0 0 0;">This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${name},

We received a request to reset your password for your Mindsta account.

Reset your password by clicking this link:
${resetUrl}

⚠️ Security Notice:
This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.

© 2024 Mindsta. All rights reserved.
  `.trim();

  if (!transporter) {
    console.log(`[Email] Password reset email (Email service not configured)`);
    console.log(`[Email] To: ${email} | Reset URL: ${resetUrl}`);
    return Promise.resolve({ success: true, message: 'Email logged (not sent - email service not configured)' });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
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
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .feature-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .feature-item:last-child { border-bottom: none; }
        .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Welcome to Mindsta!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to <strong>Mindsta</strong> - your gateway to quality education and learning excellence!</p>
          <p>We're thrilled to have you join our community of learners.</p>
          
          <div class="features">
            <h3 style="margin-top: 0; color: #667eea;">Get Started:</h3>
            <div class="feature-item">
              <strong>📚 Browse Courses</strong><br>
              <span style="color: #666; font-size: 14px;">Explore our wide range of subjects and lessons</span>
            </div>
            <div class="feature-item">
              <strong>🎯 Track Progress</strong><br>
              <span style="color: #666; font-size: 14px;">Monitor your learning journey with detailed analytics</span>
            </div>
            <div class="feature-item">
              <strong>💰 Refer & Earn</strong><br>
              <span style="color: #666; font-size: #666; font-size: 14px;">Share your referral code and earn commissions</span>
            </div>
            <div class="feature-item">
              <strong>✅ Get Certified</strong><br>
              <span style="color: #666; font-size: 14px;">Complete courses and earn certificates</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://mindsta33.vercel.app" class="btn">Start Learning</a>
          </div>
          
          <p style="margin-top: 30px; color: #666;">Need help? Our support team is here for you!</p>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${name},

Welcome to Mindsta - your gateway to quality education and learning excellence!

We're thrilled to have you join our community of learners.

Get Started:
📚 Browse Courses - Explore our wide range of subjects and lessons
🎯 Track Progress - Monitor your learning journey with detailed analytics
💰 Refer & Earn - Share your referral code and earn commissions
✅ Get Certified - Complete courses and earn certificates

Start learning at: https://mindsta33.vercel.app

Need help? Our support team is here for you!

© 2024 Mindsta. All rights reserved.
  `.trim();

  if (!transporter) {
    console.log(`[Email] Welcome email (Email service not configured)`);
    console.log(`[Email] To: ${email} | Name: ${name}`);
    return Promise.resolve({ success: true, message: 'Email logged (not sent - email service not configured)' });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎓 Welcome to Mindsta - Start Your Learning Journey!',
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
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
  console.log(`[Email] Payout request email would be sent for ${referrerName} (${referrerEmail})`);
  console.log(`[Email] Requested amount: ${amount}`);
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
  });
};

/**
 * Send payout processed confirmation email
 * @param {string} referrerEmail - Email of the referrer
 * @param {string} referrerName - Name of the referrer
 * @param {number} amount - Payout amount
 */
export const sendPayoutProcessedEmail = async (referrerEmail, referrerName, amount) => {
  console.log(`[Email] Payout processed email would be sent to ${referrerEmail}`);
  console.log(`[Email] Amount processed: ${amount}`);
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
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
  
  const itemsList = items.map(item => {
    const courseName = item.name || `${item.subject || 'Course'} - Grade ${item.grade || ''} Term ${item.term || ''}`;
    const price = (item.price || 0).toLocaleString();
    return `
    <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
      <strong>${courseName}</strong><br>
      <span style="color: #666; font-size: 14px;">${item.description || `Grade ${item.grade || ''}, Term ${item.term || ''}`}</span>
      <div style="text-align: right; color: #10b981; font-weight: bold;">₦${price}</div>
    </div>
  `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .receipt { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #10b981; }
        .total { background: #ecfdf5; padding: 15px; margin: 10px 0; border-radius: 5px; font-size: 18px; font-weight: bold; color: #059669; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Successful!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for your payment! Your transaction has been processed successfully.</p>
          
          <div class="receipt">
            <h3 style="margin-top: 0; color: #667eea;">Payment Receipt</h3>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Reference:</strong> ${reference || 'N/A'}</p>
            
            ${items.length > 0 ? `
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
              <h4 style="color: #666;">Purchased Courses:</h4>
              ${itemsList}
            ` : ''}
            
            <div class="total">
              Total Amount Paid: ₦${(amount || 0).toLocaleString()}
            </div>
          </div>
          
          <p>Your course${items.length > 1 ? 's are' : ' is'} now accessible in your dashboard.</p>
          <p>Happy learning! 🎓</p>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${name},

Thank you for your payment! Your transaction has been processed successfully.

Payment Receipt
Date: ${date}
Reference: ${reference || 'N/A'}
${items.length > 0 ? '\nPurchased Courses:\n' + items.map(item => {
  const courseName = item.name || `${item.subject || 'Course'} - Grade ${item.grade || ''} Term ${item.term || ''}`;
  return `- ${courseName}: ₦${(item.price || 0).toLocaleString()}`;
}).join('\n') : ''}

Total Amount Paid: ₦${(amount || 0).toLocaleString()}

Your course${items.length > 1 ? 's are' : ' is'} now accessible in your dashboard.
Happy learning! 🎓

© 2024 Mindsta. All rights reserved.
  `.trim();

  if (!transporter) {
    console.log(`[Email] Payment success email (Email service not configured)`);
    console.log(`[Email] To: ${email} | Amount: ₦${amount} | Ref: ${reference}`);
    return Promise.resolve({ success: true, message: 'Email logged (not sent - email service not configured)' });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
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
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .earnings-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .amount { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .stats { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .stat-item:last-child { border-bottom: none; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Commission Earned!</h1>
        </div>
        <div class="content">
          <p>Hi ${referrerName},</p>
          <p>Congratulations! You've just earned a commission from a referral purchase.</p>
          
          <div class="earnings-box">
            <p style="margin: 0; font-size: 16px;">New Commission</p>
            <div class="amount">₦${commission.toLocaleString()}</div>
            <p style="margin: 0; opacity: 0.9;">Added to your balance</p>
          </div>
          
          <div class="stats">
            <h3 style="margin-top: 0; color: #667eea;">Details</h3>
            <div class="stat-item">
              <span style="color: #666;">Referred User:</span>
              <strong>${referredName}</strong>
            </div>
            <div class="stat-item">
              <span style="color: #666;">Commission Earned:</span>
              <strong style="color: #10b981;">₦${commission.toLocaleString()}</strong>
            </div>
            <div class="stat-item">
              <span style="color: #666;">Total Earnings:</span>
              <strong style="color: #667eea;">₦${totalEarnings.toLocaleString()}</strong>
            </div>
          </div>
          
          <p>Keep sharing your referral code to earn more commissions!</p>
          <p>You can request a payout once you reach the minimum threshold.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://mindsta33.vercel.app/referral/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
          </div>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
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

View your dashboard: https://mindsta33.vercel.app/referral/dashboard

© 2024 Mindsta. All rights reserved.
  `.trim();

  if (!transporter) {
    console.log(`[Email] Commission earned email (Email service not configured)`);
    console.log(`[Email] To: ${referrerEmail} | Amount: ₦${commission}`);
    return Promise.resolve({ success: true, message: 'Email logged (not sent - email service not configured)' });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
      to: referrerEmail,
      subject: '💰 Commission Earned - Mindsta Referral Program',
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
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
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .otp-box {
          background: white;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to <strong>Mindsta</strong>! To complete your registration, please verify your email address.</p>
          
          <div class="otp-box">
            <p style="margin: 0; color: #666;">Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
          </div>
          
          <p>Enter this code on the verification page to activate your account.</p>
          <p>If you didn't create an account with Mindsta, please ignore this email.</p>
          
          <div class="footer">
            <p>© 2024 Mindsta. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${name},

Welcome to Mindsta! Please verify your email address.

Your verification code is: ${otp}

This code will expire in 10 minutes.

Enter this code on the verification page to activate your account.

If you didn't create an account with Mindsta, please ignore this email.

© 2024 Mindsta. All rights reserved.
  `.trim();

  // If transporter is not configured, fall back to console logging
  if (!transporter) {
    console.log(`[Email] ========================================`);
    console.log(`[Email] VERIFICATION OTP EMAIL (Email service not configured)`);
    console.log(`[Email] To: ${email}`);
    console.log(`[Email] Name: ${name}`);
    console.log(`[Email] OTP: ${otp}`);
    console.log(`[Email] ========================================`);

    return Promise.resolve({
      success: true,
      message: 'OTP logged (not sent - email service not configured)',
      otp: otp // Only for development
    });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Mindsta <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Mindsta',
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`[Email] ✅ Verification OTP sent successfully to ${email}`);
    
    return Promise.resolve({
      success: true,
      message: 'OTP email sent successfully'
    });
  } catch (error) {
    console.error(`[Email] ❌ Failed to send OTP email:`, error.message);
    
    // Fall back to console logging if email fails
    console.log(`[Email] ========================================`);
    console.log(`[Email] VERIFICATION OTP (Email failed, showing code here)`);
    console.log(`[Email] To: ${email}`);
    console.log(`[Email] OTP: ${otp}`);
    console.log(`[Email] ========================================`);
    
    return Promise.resolve({
      success: false,
      message: 'Email sending failed, but registration can continue',
      error: error.message,
      otp: otp // For development/debugging
    });
  }
};

/**
 * Send newsletter email to subscribers
 */
export const sendNewsletterEmail = async (email, subject, message) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 50px; margin-bottom: 10px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: bold;">📚 Mindsta</span>
            </div>
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">${subject}</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="color: #2d3748; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
              ${message}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                Visit Mindsta
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f7fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
              You're receiving this because you subscribed to Mindsta newsletter
            </p>
            <p style="color: #718096; font-size: 14px; margin: 0 0 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings" style="color: #667eea; text-decoration: none;">Manage Preferences</a> | 
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
            </p>
            <div style="margin: 20px 0;">
              <a href="https://facebook.com" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" style="width: 24px; height: 24px;">
              </a>
              <a href="https://twitter.com" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/color/48/000000/twitter--v1.png" alt="Twitter" style="width: 24px; height: 24px;">
              </a>
              <a href="https://instagram.com" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/color/48/000000/instagram-new--v1.png" alt="Instagram" style="width: 24px; height: 24px;">
              </a>
            </div>
            <p style="color: #a0aec0; font-size: 12px; margin: 20px 0 0 0;">
              © ${new Date().getFullYear()} Mindsta. All rights reserved.<br>
              Empowering minds through quality education
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainText = `
${subject}

${message}

Visit Mindsta: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

---
You're receiving this because you subscribed to Mindsta newsletter.
Manage your preferences or unsubscribe at any time.

© ${new Date().getFullYear()} Mindsta. All rights reserved.
    `.trim();

    const mailOptions = {
      from: `"Mindsta Newsletter" <${EMAIL_CONFIG.auth.user}>`,
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
