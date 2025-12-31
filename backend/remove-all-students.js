/**
 * Script to remove ALL student accounts from the database
 * WARNING: This will delete ALL users and their associated data
 * Use with caution!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function removeAllStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Analyzing database...\n');

    // Count all records
    const userCount = await User.countDocuments({});
    const studentCount = await Student.countDocuments({});
    const cartCount = await Cart.countDocuments({});
    const wishlistCount = await Wishlist.countDocuments({});
    const progressCount = await UserProgress.countDocuments({});
    const notificationCount = await Notification.countDocuments({});

    console.log('Current database status:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Student profiles: ${studentCount}`);
    console.log(`   - Carts: ${cartCount}`);
    console.log(`   - Wishlists: ${wishlistCount}`);
    console.log(`   - Progress records: ${progressCount}`);
    console.log(`   - Notifications: ${notificationCount}`);

    if (userCount === 0) {
      console.log('\n✨ No users found. Database is already clean!');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    // Show all users
    console.log('\n👥 Current users:');
    const allUsers = await User.find({}).select('fullName email userType').lean();
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - Type: ${user.userType}`);
    });

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL users and their associated data!');
    const answer = await askQuestion('\nAre you sure you want to proceed? (type "YES" to confirm): ');

    if (answer.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Operation cancelled by user.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log('\n🗑️  Starting complete database cleanup...\n');

    // Delete all student-related data
    const studentsDeleted = await Student.deleteMany({});
    console.log(`✅ Deleted ${studentsDeleted.deletedCount} student profiles`);

    const cartsDeleted = await Cart.deleteMany({});
    console.log(`✅ Deleted ${cartsDeleted.deletedCount} shopping carts`);

    const wishlistsDeleted = await Wishlist.deleteMany({});
    console.log(`✅ Deleted ${wishlistsDeleted.deletedCount} wishlists`);

    const progressDeleted = await UserProgress.deleteMany({});
    console.log(`✅ Deleted ${progressDeleted.deletedCount} progress records`);

    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);

    const usersDeleted = await User.deleteMany({});
    console.log(`✅ Deleted ${usersDeleted.deletedCount} user accounts`);

    console.log('\n🎉 Complete cleanup finished!');
    console.log('\n📈 Summary:');
    console.log(`   - Users removed: ${usersDeleted.deletedCount}`);
    console.log(`   - Student profiles removed: ${studentsDeleted.deletedCount}`);
    console.log(`   - Carts removed: ${cartsDeleted.deletedCount}`);
    console.log(`   - Wishlists removed: ${wishlistsDeleted.deletedCount}`);
    console.log(`   - Progress records removed: ${progressDeleted.deletedCount}`);
    console.log(`   - Notifications removed: ${notificationsDeleted.deletedCount}`);

    const remainingUsers = await User.countDocuments({});
    console.log(`\n👥 Remaining users in database: ${remainingUsers}`);

    rl.close();

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    rl.close();
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
removeAllStudents();
