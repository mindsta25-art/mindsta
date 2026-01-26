import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../server/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

async function checkAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const adminUsers = await User.find({ userType: 'admin' });
    console.log(`\n📊 Found ${adminUsers.length} admin user(s):`);
    
    if (adminUsers.length > 0) {
      adminUsers.forEach((admin, index) => {
        console.log(`\n${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   ID: ${admin._id}`);
      });
    } else {
      console.log('\n❌ No admin users found!');
      console.log('\n💡 Create an admin user by running:');
      console.log('   node backend/scripts/create-admin-user.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdmin();
