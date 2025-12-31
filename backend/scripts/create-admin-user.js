/**
 * Create Admin User Script
 * Creates an admin user for testing the admin panel
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  userType: { type: String, required: true },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(' Connected to MongoDB\n');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.log(' Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
      process.exit(1);
    }

    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log(' Admin user already exists');
      console.log('  Email:', adminEmail);
      console.log('  Name:', admin.fullName);
      console.log('  Type:', admin.userType);
      
      // Update password if needed
      const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
      if (!isPasswordValid) {
        console.log('  Updating admin password...');
        admin.password = await bcrypt.hash(adminPassword, 10);
        await admin.save();
        console.log('Password updated');
      } else {
        console.log(' Password is correct');
      }
    } else {
      console.log('Creating admin user...');
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        fullName: 'System Administrator',
        userType: 'admin',
        status: 'active',
      });
      console.log(' Admin user created');
    }

    console.log('\n Admin Account Created:');
    console.log('═══════════════════════════════');
    console.log('Email:', adminEmail);
    console.log('Password: [Set from environment variable]');
    console.log('═══════════════════════════════');
    console.log('\n Admin user is ready!');
    console.log('Login at: http://localhost:8080/admin-auth\n');

  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdminUser();
