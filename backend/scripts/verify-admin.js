import mongoose from 'mongoose';
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

async function verifyAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.VITE_MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('VITE_MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully\n');

    // Find all admin users
    const admins = await User.find({ userType: 'admin' });
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in the database!\n');
      console.log('Run: npm run create-admin\n');
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):\n`);
      
      admins.forEach((admin, index) => {
        console.log(`📋 Admin #${index + 1}:`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   ID:       ${admin._id}`);
        console.log(`   Email:    ${admin.email}`);
        console.log(`   Name:     ${admin.fullName}`);
        console.log(`   Type:     ${admin.userType}`);
        console.log(`   Created:  ${admin.createdAt}`);
        console.log(`   Updated:  ${admin.updatedAt}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      });
      
      console.log('🌐 Login URL: http://localhost:8080/admin-auth\n');
      console.log('📝 Default credentials (if using the default admin):');
      console.log('   Email:    [admin email from database]');
      console.log('   Password: MindstaAdmin2024!\n');
    }

    // Count all users by type
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 User Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    userCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error verifying admin:', error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
verifyAdmin();
