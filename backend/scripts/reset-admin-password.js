import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { User } from '../server/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

const ADMIN_EMAIL = 'admin@mindsta.com';
const ADMIN_PASSWORD = 'Admin@123'; // Plain password - will be hashed by frontend on login

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Hash password (simple hash since model doesn't use bcrypt)
    const hashedPassword = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
    
    // Check if admin exists
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!admin) {
      console.log(`\n❌ Admin user ${ADMIN_EMAIL} not found. Creating new admin...`);
      
      admin = new User({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        fullName: 'Admin User',
        userType: 'admin',
        status: 'active',
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully!');
    } else {
      console.log(`\n✅ Admin user found. Resetting password...`);
      
      admin.password = hashedPassword;
      await admin.save();
      
      console.log('✅ Password reset successfully!');
    }
    
    console.log('\n📧 Admin Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🔗 Login at: http://localhost:8080/login');
    console.log('\n⚠️  Note: Use these credentials to log in to the admin panel');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
