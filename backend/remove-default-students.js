/**
 * Script to remove all default/test student accounts from the database
 * This will clean up any test data and default accounts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import User from './server/models/User.js';
import Student from './server/models/Student.js';
import Cart from './server/models/Cart.js';
import Wishlist from './server/models/Wishlist.js';
import UserProgress from './server/models/UserProgress.js';
import Notification from './server/models/Notification.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindsta';

// Common default/test patterns to identify
const DEFAULT_PATTERNS = [
  'test',
  'demo',
  'sample',
  'example',
  'default',
  'admin@test',
  'user@test',
  'student@test',
];

const isDefaultAccount = (email, fullName) => {
  const emailLower = email.toLowerCase();
  const nameLower = fullName.toLowerCase();
  
  return DEFAULT_PATTERNS.some(pattern => 
    emailLower.includes(pattern) || nameLower.includes(pattern)
  );
};

async function removeDefaultStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Analyzing database for default student accounts...\n');

    // Find all users
    const allUsers = await User.find({}).lean();
    console.log(`Total users in database: ${allUsers.length}`);

    // Filter default accounts
    const defaultUsers = allUsers.filter(user => 
      isDefaultAccount(user.email, user.fullName)
    );

    console.log(`\n🎯 Found ${defaultUsers.length} default/test accounts:\n`);
    defaultUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - Type: ${user.userType}`);
    });

    if (defaultUsers.length === 0) {
      console.log('\n✨ No default accounts found. Database is clean!');
      await mongoose.disconnect();
      return;
    }

    // Get user IDs to delete
    const userIdsToDelete = defaultUsers.map(user => user._id);

    console.log('\n🗑️  Starting cleanup process...\n');

    // Delete associated student profiles
    const studentsDeleted = await Student.deleteMany({ 
      userId: { $in: userIdsToDelete } 
    });
    console.log(`✅ Deleted ${studentsDeleted.deletedCount} student profiles`);

    // Delete associated carts
    const cartsDeleted = await Cart.deleteMany({ 
      userId: { $in: userIdsToDelete } 
    });
    console.log(`✅ Deleted ${cartsDeleted.deletedCount} shopping carts`);

    // Delete associated wishlists
    const wishlistsDeleted = await Wishlist.deleteMany({ 
      userId: { $in: userIdsToDelete } 
    });
    console.log(`✅ Deleted ${wishlistsDeleted.deletedCount} wishlists`);

    // Delete user progress
    const progressDeleted = await UserProgress.deleteMany({ 
      userId: { $in: userIdsToDelete } 
    });
    console.log(`✅ Deleted ${progressDeleted.deletedCount} progress records`);

    // Delete notifications
    const notificationsDeleted = await Notification.deleteMany({ 
      $or: [
        { targetUsers: { $in: userIdsToDelete } },
        { createdBy: { $in: userIdsToDelete } }
      ]
    });
    console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);

    // Finally, delete the user accounts
    const usersDeleted = await User.deleteMany({ 
      _id: { $in: userIdsToDelete } 
    });
    console.log(`✅ Deleted ${usersDeleted.deletedCount} user accounts`);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`   - Users removed: ${usersDeleted.deletedCount}`);
    console.log(`   - Student profiles removed: ${studentsDeleted.deletedCount}`);
    console.log(`   - Carts removed: ${cartsDeleted.deletedCount}`);
    console.log(`   - Wishlists removed: ${wishlistsDeleted.deletedCount}`);
    console.log(`   - Progress records removed: ${progressDeleted.deletedCount}`);
    console.log(`   - Notifications removed: ${notificationsDeleted.deletedCount}`);

    // Show remaining accounts
    const remainingUsers = await User.countDocuments({});
    console.log(`\n👥 Remaining users in database: ${remainingUsers}`);

    if (remainingUsers > 0) {
      const users = await User.find({}).select('fullName email userType').lean();
      console.log('\nRemaining accounts:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} (${user.email}) - Type: ${user.userType}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
removeDefaultStudents();
