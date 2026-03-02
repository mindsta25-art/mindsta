/**
 * Test Email Service
 * Run this to test if your email configuration is working
 */

import dotenv from 'dotenv';
import { sendVerificationOTP } from './server/services/emailService.js';

dotenv.config();

console.log('\n📧 Testing Email Service Configuration\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n1. Checking Email Configuration:');
console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || '❌ Not set'}`);
console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '❌ Not set'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ Not set'}`);
console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set'}`);
console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Not set'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('\n⚠️  Email credentials not configured!');
  console.log('\nTo configure:');
  console.log('1. Edit backend/.env file');
  console.log('2. Set EMAIL_USER to your Gmail address');
  console.log('3. Set EMAIL_PASSWORD to your Gmail App Password');
  console.log('4. See EMAIL_SETUP_GUIDE.md for detailed instructions');
  console.log('\n📝 For now, OTP codes will be logged to console.');
} else {
  console.log('\n✅ Email credentials configured!');
}

console.log('\n=' + '='.repeat(60));

// Send test OTP
console.log('\n2. Sending Test OTP Email...\n');

const testEmail = process.env.EMAIL_USER || 'test@example.com';
const testName = 'Test User';
const testOTP = '123456';

try {
  const result = await sendVerificationOTP(testEmail, testName, testOTP);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n3. Result:');
  console.log(`   Success: ${result.success ? '✅ Yes' : '❌ No'}`);
  console.log(`   Message: ${result.message}`);
  
  if (result.success) {
    console.log('\n✅ Email service is working!');
    console.log(`   Check ${testEmail} for the test OTP email.`);
  } else {
    console.log('\n⚠️  Email sending failed, but OTP was logged to console.');
    console.log(`   Error: ${result.error || 'Unknown'}`);
  }
  
} catch (error) {
  console.error('\n❌ Error testing email service:', error.message);
  console.error(error);
}

console.log('\n' + '='.repeat(60) + '\n');
