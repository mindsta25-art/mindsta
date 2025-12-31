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

// User Schema (inline for standalone script)
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

// Default admin credentials
const DEFAULT_ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
  password: 'MindstaAdmin2024!',
  fullName: 'Mindsta Administrator',
  userType: 'admin',
};

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.VITE_MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('VITE_MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
    
    if (existingAdmin) {
      console.log('⚠️  Default admin already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.fullName}`);
      console.log(`   Type: ${existingAdmin.userType}`);
      console.log(`   Created: ${existingAdmin.createdAt}\n`);
      
      // Ask if user wants to update password
      console.log('ℹ️  If you need to reset the password, delete the user first and run this script again.\n');
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

    // Create admin user
    console.log('👤 Creating default admin user...');
    const admin = new User({
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      fullName: DEFAULT_ADMIN.fullName,
      userType: DEFAULT_ADMIN.userType,
    });

    await admin.save();

    console.log('\n✅ Default admin created successfully!\n');
    console.log('📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log(`   Name:     ${DEFAULT_ADMIN.fullName}`);
    console.log(`   Type:     ${DEFAULT_ADMIN.userType}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');
    console.log('🌐 Login URL: http://localhost:8080/admin-auth\n');

  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - admin may already exist');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createDefaultAdmin();
