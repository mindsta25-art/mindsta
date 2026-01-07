/**
 * Email Service
 * Handles sending emails (currently stubbed for production)
 */

/**
 * Send referral signup notification email
 * @param {string} referrerEmail - Email of the referrer
 * @param {string} referrerName - Name of the referrer
 * @param {string} referredName - Name of the person who signed up
 * @param {string} referralCode - The referral code used
 */
export const sendReferralSignupEmail = async (referrerEmail, referrerName, referredName, referralCode) => {
  console.log(`[Email] Referral signup notification would be sent to ${referrerEmail}`);
  console.log(`[Email] ${referredName} signed up using code ${referralCode}`);
  
  // TODO: Implement actual email sending with your email service provider
  // Example: SendGrid, Mailgun, AWS SES, etc.
  // For now, just log the email details
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
  });
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} resetUrl - Password reset URL with token
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  console.log(`[Email] Password reset email would be sent to ${email}`);
  console.log(`[Email] Reset URL: ${resetUrl}`);
  
  // TODO: Implement actual email sending with your email service provider
  // Example email content:
  // Subject: Reset Your Password
  // Body: Hi {name}, Click here to reset your password: {resetUrl}
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
  });
};

/**
 * Send welcome email to new users
 * @param {string} email - User's email
 * @param {string} name - User's name
 */
export const sendWelcomeEmail = async (email, name) => {
  console.log(`[Email] Welcome email would be sent to ${email}`);
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
  });
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
  console.log(`[Email] Payment success email would be sent to ${email}`);
  console.log(`[Email] Payment details:`, paymentDetails);
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
  });
};

/**
 * Send commission earned email to referrer
 * @param {string} referrerEmail - Email of the referrer
 * @param {string} referrerName - Name of the referrer
 * @param {number} commission - Commission amount earned
 */
export const sendCommissionEarnedEmail = async (referrerEmail, referrerName, commission) => {
  console.log(`[Email] Commission earned email would be sent to ${referrerEmail}`);
  console.log(`[Email] Commission amount: ${commission}`);
  
  return Promise.resolve({
    success: true,
    message: 'Email logged (not sent - email service not configured)'
  });
};
