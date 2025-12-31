import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// User Schema
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ['student', 'parent', 'educator', 'admin', 'referral'],
      default: 'student',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', UserSchema);

// Custom admin credentials
const CUSTOM_ADMIN = {
  email: 'daniel@mindsta.com',
  password: 'Daniel@Mindsta2025!',
  fullName: 'Daniel Enuabanosa',
  userType: 'admin',
};

async function createCustomAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.VITE_MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('VITE_MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully\n');

    // Check if admin with this email already exists
    const existingAdmin = await User.findOne({ email: CUSTOM_ADMIN.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user with this email already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.fullName}`);
      console.log(`   Type: ${existingAdmin.userType}`);
      console.log(`   Created: ${existingAdmin.createdAt}\n`);
      
      // Update password
      console.log('🔐 Updating password...');
      const hashedPassword = await bcrypt.hash(CUSTOM_ADMIN.password, 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.fullName = CUSTOM_ADMIN.fullName;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!\n');
    } else {
      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(CUSTOM_ADMIN.password, 12);

      // Create admin user
      console.log('👤 Creating custom admin user...');
      const admin = new User({
        email: CUSTOM_ADMIN.email,
        password: hashedPassword,
        fullName: CUSTOM_ADMIN.fullName,
        userType: CUSTOM_ADMIN.userType,
      });

      await admin.save();
      console.log('\n✅ Custom admin created successfully!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 YOUR ADMIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${CUSTOM_ADMIN.email}`);
    console.log(`   Password: ${CUSTOM_ADMIN.password}`);
    console.log(`   Name:     ${CUSTOM_ADMIN.fullName}`);
    console.log(`   Type:     ${CUSTOM_ADMIN.userType}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 Login URL: http://localhost:8080/admin-auth\n');
    console.log('✅ You can now log in with these credentials!\n');

  } catch (error) {
    console.error('❌ Error creating custom admin:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - This should not happen with update logic');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createCustomAdmin();
