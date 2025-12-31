/**
 * Script to list all users and remove specific ones by email
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

// Create readline interface
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

async function manageUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find({}).select('_id fullName email userType createdAt').lean();
    
    if (allUsers.length === 0) {
      console.log('✨ No users found in database.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log(`📊 Total users in database: ${allUsers.length}\n`);
    console.log('👥 Current users:\n');
    
    allUsers.forEach((user, index) => {
      const createdDate = new Date(user.createdAt).toLocaleDateString();
      console.log(`${index + 1}. ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.userType}`);
      console.log(`   Created: ${createdDate}`);
      console.log('');
    });

    // Ask user what to do
    console.log('Options:');
    console.log('1. Remove specific users by email (comma-separated)');
    console.log('2. Remove ALL users (complete wipe)');
    console.log('3. Exit without changes\n');

    const choice = await askQuestion('Enter your choice (1-3): ');

    if (choice.trim() === '3') {
      console.log('\n✅ No changes made.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    if (choice.trim() === '2') {
      const confirm = await askQuestion('\n⚠️  Are you SURE you want to delete ALL users? (type "YES" to confirm): ');
      
      if (confirm.trim().toUpperCase() !== 'YES') {
        console.log('\n❌ Operation cancelled.');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      console.log('\n🗑️  Deleting all users and associated data...\n');

      const studentsDeleted = await Student.deleteMany({});
      const cartsDeleted = await Cart.deleteMany({});
      const wishlistsDeleted = await Wishlist.deleteMany({});
      const progressDeleted = await UserProgress.deleteMany({});
      const notificationsDeleted = await Notification.deleteMany({});
      const usersDeleted = await User.deleteMany({});

      console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);
      console.log(`✅ Deleted ${studentsDeleted.deletedCount} student profiles`);
      console.log(`✅ Deleted ${cartsDeleted.deletedCount} carts`);
      console.log(`✅ Deleted ${wishlistsDeleted.deletedCount} wishlists`);
      console.log(`✅ Deleted ${progressDeleted.deletedCount} progress records`);
      console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);
      console.log('\n🎉 All users removed successfully!');

    } else if (choice.trim() === '1') {
      const emailInput = await askQuestion('\nEnter email addresses to remove (comma-separated): ');
      const emails = emailInput.split(',').map(e => e.trim().toLowerCase()).filter(e => e);

      if (emails.length === 0) {
        console.log('\n❌ No valid emails provided.');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      // Find matching users
      const usersToDelete = await User.find({ 
        email: { $in: emails } 
      }).select('_id fullName email').lean();

      if (usersToDelete.length === 0) {
        console.log('\n❌ No matching users found.');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      console.log(`\n🎯 Found ${usersToDelete.length} user(s) to delete:\n`);
      usersToDelete.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} (${user.email})`);
      });

      const confirm = await askQuestion('\nConfirm deletion? (type "YES" to proceed): ');
      
      if (confirm.trim().toUpperCase() !== 'YES') {
        console.log('\n❌ Operation cancelled.');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      const userIds = usersToDelete.map(u => u._id);

      console.log('\n🗑️  Deleting users and associated data...\n');

      const studentsDeleted = await Student.deleteMany({ userId: { $in: userIds } });
      const cartsDeleted = await Cart.deleteMany({ userId: { $in: userIds } });
      const wishlistsDeleted = await Wishlist.deleteMany({ userId: { $in: userIds } });
      const progressDeleted = await UserProgress.deleteMany({ userId: { $in: userIds } });
      const notificationsDeleted = await Notification.deleteMany({ 
        $or: [
          { targetUsers: { $in: userIds } },
          { createdBy: { $in: userIds } }
        ]
      });
      const usersDeleted = await User.deleteMany({ _id: { $in: userIds } });

      console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);
      console.log(`✅ Deleted ${studentsDeleted.deletedCount} student profiles`);
      console.log(`✅ Deleted ${cartsDeleted.deletedCount} carts`);
      console.log(`✅ Deleted ${wishlistsDeleted.deletedCount} wishlists`);
      console.log(`✅ Deleted ${progressDeleted.deletedCount} progress records`);
      console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);
      console.log('\n🎉 Selected users removed successfully!');

      const remainingCount = await User.countDocuments({});
      console.log(`\n👥 Remaining users: ${remainingCount}`);

    } else {
      console.log('\n❌ Invalid choice.');
    }

    rl.close();

  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
manageUsers();
