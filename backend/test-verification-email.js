/**
 * Test Email Verification Success Email
 */

import dotenv from 'dotenv';
import { sendEmailVerifiedEmail } from './server/services/emailService.js';

dotenv.config();

const testEmail = process.env.EMAIL_USER || 'test@example.com';
const testName = 'Test User';

console.log('\n🎉 Testing Email Verification Success Email\n');
console.log('='.repeat(60));
console.log(`\nSending to: ${testEmail}\n`);
console.log('='.repeat(60));

async function testVerificationEmail() {
  try {
    console.log('\n📧 Sending congratulatory email...\n');
    
    const result = await sendEmailVerifiedEmail(testEmail, testName);
    
    console.log('='.repeat(60));
    console.log('\nResult:');
    console.log(`   Success: ${result.success ? '✅ Yes' : '❌ No'}`);
    console.log(`   Message: ${result.message}`);
    
    if (result.success) {
      console.log('\n✅ Congratulatory email sent successfully!');
      console.log(`   Check ${testEmail} for the email.`);
      console.log('\nEmail includes:');
      console.log('   🎉 Celebration header with success icon');
      console.log('   ✨ Welcome message and account activation confirmation');
      console.log('   📚 List of available features');
      console.log('   🎯 Call-to-action button');
      console.log('   💡 Pro tip for better experience');
    } else {
      console.log(`\n⚠️  Email sending failed: ${result.error || 'Unknown error'}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error testing email:', error.message);
    console.error(error);
  }
}

testVerificationEmail();
