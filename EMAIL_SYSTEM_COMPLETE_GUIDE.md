# 📧 Professional Email System - Complete Setup Guide

## Overview

The Mindsta platform now features a **professional-grade email system** built with **Nodemailer**, including:

- ✅ **Multiple SMTP Provider Support** (Gmail, Outlook, Custom)
- ✅ **Connection Pooling** for high performance
- ✅ **Rate Limiting** to prevent spam flags
- ✅ **Automatic Retry Logic** with exponential backoff
- ✅ **Email Verification** on startup
- ✅ **Professional HTML Email Templates**

---

## 🚀 Quick Start

### 1. Choose Your Email Provider

#### Option A: Gmail (Recommended for Development)

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Mindsta <noreply@mindsta.com>
```

#### Option B: Outlook/Hotmail

```bash
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Mindsta <noreply@mindsta.com>
```

#### Option C: Custom SMTP Server

```bash
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Mindsta <noreply@yourdomain.com>
```

---

## 📋 Gmail Setup (Step-by-Step)

### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **"2-Step Verification"**
3. Follow the setup wizard

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **"Mail"** as the app
3. Select **"Other"** as the device and name it "Mindsta"
4. Click **"Generate"**
5. Copy the **16-character password** (format: `xxxx xxxx xxxx xxxx`)

### Step 3: Configure .env File
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Paste the app password here
EMAIL_FROM=Mindsta <noreply@mindsta.com>
```

### Step 4: Test the Configuration
```bash
cd backend
node test-email.js
```

---

## 📋 Outlook Setup (Step-by-Step)

### Step 1: Enable 2-Step Verification
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable **"Two-step verification"**

### Step 2: Generate App Password (if required)
1. Some Outlook accounts require app passwords
2. If prompted, generate one at the security page

### Step 3: Configure .env File
```bash
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password-or-app-password
EMAIL_FROM=Mindsta <noreply@mindsta.com>
```

---

## 🔧 Advanced Configuration

### Connection Pooling (High Performance)

Connection pooling keeps SMTP connections open, dramatically improving email sending speed for bulk operations.

```bash
# Enable connection pooling
EMAIL_POOL=true

# Maximum concurrent connections
EMAIL_MAX_CONNECTIONS=5

# Maximum messages per connection before reconnecting
EMAIL_MAX_MESSAGES=100
```

**Benefits:**
- Faster email sending (no connection overhead)
- Better resource utilization
- Automatic connection management

---

### Rate Limiting (Prevent Spam Flags)

Rate limiting controls how many emails are sent per second, preventing your emails from being flagged as spam.

```bash
# Maximum emails per second
EMAIL_RATE_LIMIT=5

# Time window in milliseconds
EMAIL_RATE_DELTA=1000
```

**Recommended Settings:**
- **Gmail Free**: 5 emails/second
- **Gmail Business**: 10 emails/second
- **Custom SMTP**: Check with your provider

---

### Automatic Retry Logic

The system automatically retries failed emails with exponential backoff.

```bash
# Number of retry attempts
EMAIL_MAX_RETRIES=3

# Initial delay between retries (ms)
EMAIL_RETRY_DELAY=1000
```

**Retry Strategy:**
- 1st retry: After 1 second
- 2nd retry: After 2 seconds
- 3rd retry: After 4 seconds

---

## 📬 Email Types Supported

### 1. Welcome Emails
Sent when new users register on the platform.

### 2. Email Verification
Sent to verify user email addresses with secure tokens.

### 3. Password Reset
Sent when users request password resets.

### 4. Payment Confirmation
Sent after successful course purchases.

### 5. Course Enrollment
Sent when users are enrolled in courses.

### 6. Admin Notifications
Sent to admins for important system events.

---

## 🧪 Testing Your Email Configuration

### Test Email Service
```bash
cd backend
node test-email.js
```

### Test Specific Email Types
```bash
# Test verification email
node test-verification-email.js

# Test all email templates
node test-all-emails.js
```

### Expected Output
```
✅ Email transporter verified successfully!
✅ Test email sent: 250 2.0.0 OK
📧 Email sent successfully!
```

---

## 🛠️ Troubleshooting

### Error: "Invalid login credentials"

**Solution for Gmail:**
1. Ensure 2-Step Verification is enabled
2. Generate a new App Password
3. Copy the entire 16-character code (with spaces)
4. Remove spaces when pasting into .env

**Solution for Outlook:**
1. Check if your account requires an App Password
2. Try using your regular password first
3. If that fails, generate an App Password

---

### Error: "Connection timeout"

**Solution:**
1. Check your EMAIL_HOST and EMAIL_PORT
2. Verify your firewall allows outbound SMTP connections
3. Try alternative ports:
   - Port 587 (TLS) - Most common
   - Port 465 (SSL) - Gmail alternative
   - Port 25 (Plain) - Usually blocked

```bash
# Try SSL instead of TLS
EMAIL_PORT=465
EMAIL_SECURE=true
```

---

### Error: "Rate limit exceeded"

**Solution:**
1. Reduce EMAIL_RATE_LIMIT value
2. Increase EMAIL_RATE_DELTA for longer windows
3. Enable connection pooling if not already active

```bash
# Conservative settings
EMAIL_RATE_LIMIT=3
EMAIL_RATE_DELTA=1000
EMAIL_POOL=true
```

---

### Emails Going to Spam Folder

**Solutions:**
1. **Add SPF Record** to your domain's DNS:
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **Add DKIM Signature** (consult your email provider)

3. **Set proper FROM address**:
   ```bash
   EMAIL_FROM=Mindsta <noreply@yourdomain.com>
   ```

4. **Reduce sending rate**:
   ```bash
   EMAIL_RATE_LIMIT=3
   ```

5. **Warm up your email address** by sending gradually increasing volumes

---

## 🔐 Security Best Practices

### 1. Never Commit .env Files
```bash
# .gitignore should include:
.env
.env.local
.env.*.local
```

### 2. Use App Passwords (Not Account Passwords)
Always use app-specific passwords, never your main account password.

### 3. Rotate Credentials Regularly
Change your app passwords every 90 days.

### 4. Use Environment-Specific Configs
```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

### 5. Monitor Email Logs
Check backend logs regularly for failed email attempts:
```bash
grep "Email sent" logs/app.log
grep "Email failed" logs/app.log
```

---

## 📊 Performance Monitoring

### Check Email Service Status
The system verifies email configuration on startup:

```
[EMAIL] Using Gmail service
[EMAIL] Transporter verified successfully! ✅
[EMAIL] Email service is ready to send emails
```

### Monitor Email Sending
```javascript
// Check retry attempts
[EMAIL] Retry attempt 1/3 after error: Connection timeout

// Check successful sends
[EMAIL] Email sent successfully: Password reset to user@example.com
```

---

## 🌐 Production Deployment

### Vercel/Netlify Functions
```bash
# Add to vercel.json or netlify.toml
[build.environment]
  EMAIL_SERVICE = "gmail"
  EMAIL_USER = "@email-user"
  EMAIL_PASSWORD = "@email-password"
  EMAIL_FROM = "Mindsta <noreply@mindsta.com>"
```

### AWS Lambda
Use AWS Secrets Manager for email credentials:
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const getEmailCredentials = async () => {
  const secret = await secretsManager.getSecretValue({ 
    SecretId: 'mindsta/email' 
  }).promise();
  return JSON.parse(secret.SecretString);
};
```

### Docker
```dockerfile
# docker-compose.yml
environment:
  - EMAIL_SERVICE=gmail
  - EMAIL_USER=${EMAIL_USER}
  - EMAIL_PASSWORD=${EMAIL_PASSWORD}
  - EMAIL_FROM=${EMAIL_FROM}
```

---

## 📚 API Reference

### sendEmailWithRetry(mailOptions)
Sends an email with automatic retry logic.

**Parameters:**
```typescript
interface MailOptions {
  to: string;              // Recipient email
  subject: string;         // Email subject
  html: string;           // HTML content
  text?: string;          // Plain text fallback
  from?: string;          // Override sender (optional)
  replyTo?: string;       // Reply-to address (optional)
}
```

**Returns:**
```typescript
Promise<{ messageId: string }>
```

**Example:**
```javascript
const result = await sendEmailWithRetry({
  to: 'user@example.com',
  subject: 'Welcome to Mindsta',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome!'
});

console.log('Email sent:', result.messageId);
```

---

## 🎯 Email Templates

All email templates are in `backend/server/services/emailService.js`:

- `sendWelcomeEmail(email, name)`
- `sendVerificationEmail(email, token)`
- `sendPasswordResetEmail(email, resetToken)`
- `sendPaymentSuccessEmail(email, paymentDetails)`
- `sendEnrollmentEmail(email, courseDetails)`

### Customizing Templates

Edit the HTML in `emailService.js`:

```javascript
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* Your custom styles */
      </style>
    </head>
    <body>
      <!-- Your custom template -->
    </body>
  </html>
`;
```

---

## ✅ Configuration Checklist

- [ ] Email service provider chosen (Gmail/Outlook/Custom)
- [ ] 2-Step Verification enabled on email account
- [ ] App Password generated
- [ ] .env file configured with credentials
- [ ] Test email sent successfully
- [ ] Connection pooling enabled (optional)
- [ ] Rate limiting configured (optional)
- [ ] Email logs monitored
- [ ] Credentials secured (not committed to git)
- [ ] SPF/DKIM records added (production only)

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for error messages
3. Test with the provided test scripts
4. Verify your email provider's SMTP settings
5. Check firewall and network configurations

---

## 🎉 Success!

Your professional email system is now configured and ready to send:

- ✅ Welcome emails to new users
- ✅ Verification emails with secure tokens
- ✅ Password reset emails
- ✅ Payment confirmation emails
- ✅ Course enrollment notifications
- ✅ Admin alerts

**Next Steps:**
- Monitor email delivery rates
- Configure SPF/DKIM for production
- Set up email templates for your brand
- Enable email analytics (optional)

---

**Last Updated:** January 2025
**Version:** 2.0.0
