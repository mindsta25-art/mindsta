# Email Setup Guide

## Quick Setup (5 minutes)

The email service is now configured and ready to send real emails! You just need to add your Gmail credentials.

### Option 1: Gmail with App Password (Recommended)

1. **Open your `.env` file** in the backend folder

2. **Update these lines:**
   ```env
   EMAIL_USER="your-actual-email@gmail.com"
   EMAIL_PASSWORD="your-app-password-here"
   ```

3. **Get your Gmail App Password:**
   - Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Enable **2-Step Verification** (if not already enabled)
   - Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select app: **Mail**
   - Select device: **Other** (Custom name) → Type "Mindsta"
   - Click **Generate**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
   - Paste it in your `.env` file (remove spaces: `abcdefghijklmnop`)

4. **Restart your backend server** (if it's running)

### Option 2: Gmail without 2FA (Less Secure)

If you don't have 2-Step Verification and don't want to enable it:

1. **Update your `.env`:**
   ```env
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-regular-gmail-password"
   ```

2. **Enable "Less Secure App Access":**
   - Go to [https://myaccount.google.com/lesssecureapps](https://myaccount.google.com/lesssecureapps)
   - Turn ON "Allow less secure apps"
   - ⚠️ **Note:** This is less secure and Google may block it

### Testing the Email Service

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Register a new account** with your real email address

3. **Check your email** for the OTP code

4. **Check the console** - you should see:
   ```
   [Email] ✅ Verification OTP sent successfully to your@email.com
   ```

### Troubleshooting

#### "Email service not configured" warning
- Make sure `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Remove the quotes if you added them
- Restart the backend server

#### Email not received
- Check your spam/junk folder
- Verify the email address is correct in `.env`
- Check the console for errors
- Make sure the app password is correct (no spaces)

#### "Invalid login" error
- Your app password might be incorrect
- Try regenerating a new app password
- Make sure 2-Step Verification is enabled

#### Gmail blocks the email
- Make sure you're using an App Password, not your regular password
- Check [https://myaccount.google.com/notifications](https://myaccount.google.com/notifications) for security alerts

## Production Setup (SendGrid/Mailgun)

For production, consider using a dedicated email service:

### SendGrid Setup

1. **Sign up** at [https://sendgrid.com](https://sendgrid.com) (free 100 emails/day)

2. **Create an API Key:**
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permission
   - Copy the API key

3. **Update `.env`:**
   ```env
   EMAIL_HOST="smtp.sendgrid.net"
   EMAIL_PORT=587
   EMAIL_USER="apikey"
   EMAIL_PASSWORD="your-sendgrid-api-key"
   EMAIL_FROM="noreply@mindsta.com"
   ```

### Mailgun Setup

1. **Sign up** at [https://mailgun.com](https://mailgun.com) (free 5,000 emails/month)

2. **Get SMTP credentials:**
   - Go to Sending → Domain Settings → SMTP Credentials
   - Copy your login and password

3. **Update `.env`:**
   ```env
   EMAIL_HOST="smtp.mailgun.org"
   EMAIL_PORT=587
   EMAIL_USER="postmaster@your-domain.mailgun.org"
   EMAIL_PASSWORD="your-mailgun-password"
   EMAIL_FROM="noreply@mindsta.com"
   ```

## Current Email Features

✅ **OTP Verification Email** - Beautiful HTML template with styled OTP code
✅ **Email Verified Congratulations** - Celebration email sent after successful verification
✅ **Welcome Email** - Onboarding email for new users
✅ **Referral Signup Notification** - Alerts referrers when someone uses their code
✅ **Password Reset Email** - Secure password recovery link
✅ **Payment Success Email** - Receipt with itemized details
✅ **Commission Earned Email** - Notification of referral earnings
✅ **Automatic Fallback** - If email fails, messages are logged to console
✅ **Error Handling** - Graceful failure, user experience never breaks

## What's Implemented

All email functions are now fully implemented and ready to use:

- ✅ `sendVerificationOTP()` - Send OTP code for email verification
- ✅ `sendEmailVerifiedEmail()` - Congratulate users on successful verification
- ✅ `sendReferralSignupEmail()` - Notify referrer when someone signs up
- ✅ `sendPasswordResetEmail()` - Send password reset link
- ✅ `sendWelcomeEmail()` - Welcome new users
- ✅ `sendPaymentSuccessEmail()` - Confirm successful payments
- ✅ `sendCommissionEarnedEmail()` - Notify referrers of earnings

All these functions are in `backend/server/services/emailService.js` and use the same transporter.
