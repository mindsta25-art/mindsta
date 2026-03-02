/**
 * Test All Email Functions
 * Demonstrates all implemented email templates
 */

import dotenv from 'dotenv';
import {
  sendVerificationOTP,
  sendEmailVerifiedEmail,
  sendReferralSignupEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendCommissionEarnedEmail
} from './server/services/emailService.js';

dotenv.config();

const testEmail = process.env.EMAIL_USER || 'test@example.com';
const testName = 'Test User';

console.log('\n📧 Testing All Email Templates\n');
console.log('='.repeat(60));
console.log(`\nSending test emails to: ${testEmail}\n`);
console.log('='.repeat(60));

async function testAllEmails() {
  try {
    // 1. OTP Verification Email
    console.log('\n1️⃣  Testing OTP Verification Email...');
    await sendVerificationOTP(testEmail, testName, '123456');
    console.log('   ✅ Done\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Email Verified Congratulations
    console.log('2️⃣  Testing Email Verified Congratulations...');
    await sendEmailVerifiedEmail(testEmail, testName);
    console.log('   ✅ Done\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Welcome Email
    console.log('3️⃣  Testing Welcome Email...');
    await sendWelcomeEmail(testEmail, testName);
    console.log('   ✅ Done\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Referral Signup Email
    console.log('4️⃣  Testing Referral Signup Email...');
    await sendReferralSignupEmail(testEmail, testName, 'John Doe', 'REF123');
    console.log('   ✅ Done\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Password Reset Email
    console.log('5️⃣  Testing Password Reset Email...');
    const resetUrl = 'https://mindsta33.vercel.app/reset-password?token=abc123xyz';
    await sendPasswordResetEmail(testEmail, testName, resetUrl);
    console.log('   ✅ Done\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Payment Success Email
    console.log('6️⃣  Testing Payment Success Email...');
    const paymentDetails = {
      amount: 15000,
      reference: 'PAY-2024-12345',
      date: new Date().toLocaleDateString(),
      items: [
        { name: 'Mathematics Grade 5', description: 'Complete course with quizzes', price: 8000 },
        { name: 'English Language Grade 5', description: 'Grammar and comprehension', price: 7000 }
      ]
    };
    await sendPaymentSuccessEmail(testEmail, testName, paymentDetails);
    console.log('   ✅ Done\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. Commission Earned Email
    console.log('7️⃣  Testing Commission Earned Email...');
    const commissionDetails = {
      referredName: 'Jane Smith',
      totalEarnings: 50000
    };
    await sendCommissionEarnedEmail(testEmail, testName, 5000, commissionDetails);
    console.log('   ✅ Done\n');

    console.log('='.repeat(60));
    console.log('\n✅ All Test Emails Sent!\n');
    console.log(`📬 Check ${testEmail} for 7 test emails:\n`);
    console.log('   1. OTP Verification (Purple header)');
    console.log('   2. Email Verified Congratulations (Green header) 🎉');
    console.log('   3. Welcome Email (Green header)');
    console.log('   4. Referral Signup (Purple header)');
    console.log('   5. Password Reset (Red header)');
    console.log('   6. Payment Success (Green header)');
    console.log('   7. Commission Earned (Yellow header)');
    console.log('\n='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error testing emails:', error.message);
    console.error(error);
  }
}

testAllEmails();
