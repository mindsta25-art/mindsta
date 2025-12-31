/**
 * MongoDB Index Creation Script
 * Run this script to create indexes for better query performance
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';
import Student from '../server/models/Student.js';
import Referral from '../server/models/Referral.js';
import ReferralProfile from '../server/models/ReferralProfile.js';
import ReferralTransaction from '../server/models/ReferralTransaction.js';
import Payment from '../server/models/Payment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    console.log('\n📊 Creating/Verifying indexes...\n');

    // User indexes
    console.log('Creating User indexes...');
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ userType: 1 });
      await User.collection.createIndex({ referralCode: 1 }, { unique: true, sparse: true });
      console.log('✓ User indexes created/verified');
    } catch (err) {
      if (err.code === 86) {
        console.log('✓ User indexes already exist');
      } else throw err;
    }

    // Student indexes
    console.log('Creating Student indexes...');
    try {
      await Student.collection.createIndex({ userId: 1 }, { unique: true });
      await Student.collection.createIndex({ email: 1 });
      await Student.collection.createIndex({ isPaid: 1 });
      await Student.collection.createIndex({ grade: 1 });
      console.log('✓ Student indexes created/verified');
    } catch (err) {
      if (err.code === 86) {
        console.log('✓ Student indexes already exist');
      } else throw err;
    }

    // Referral indexes
    console.log('Creating Referral indexes...');
    try {
      await Referral.collection.createIndex({ referrerId: 1 });
      await Referral.collection.createIndex({ referredUserId: 1 });
      await Referral.collection.createIndex({ referredEmail: 1 });
      await Referral.collection.createIndex({ status: 1 });
      await Referral.collection.createIndex({ referrerId: 1, status: 1 }); // Compound index
      await Referral.collection.createIndex({ createdAt: -1 }); // Sort by date
      console.log('✓ Referral indexes created/verified');
    } catch (err) {
      if (err.code === 86) {
        console.log('✓ Referral indexes already exist');
      } else throw err;
    }

    // ReferralProfile indexes
    console.log('Creating ReferralProfile indexes...');
    try {
      await ReferralProfile.collection.createIndex({ userId: 1 }, { unique: true });
      await ReferralProfile.collection.createIndex({ pendingEarnings: 1 });
      console.log('✓ ReferralProfile indexes created/verified');
    } catch (err) {
      if (err.code === 86) {
        console.log('✓ ReferralProfile indexes already exist');
      } else throw err;
    }

    // ReferralTransaction indexes
    console.log('Creating ReferralTransaction indexes...');
    try {
      await ReferralTransaction.collection.createIndex({ userId: 1 });
      await ReferralTransaction.collection.createIndex({ studentId: 1 });
      await ReferralTransaction.collection.createIndex({ paymentId: 1 });
      await ReferralTransaction.collection.createIndex({ status: 1 });
      await ReferralTransaction.collection.createIndex({ userId: 1, status: 1 }); // Compound index
      await ReferralTransaction.collection.createIndex({ createdAt: -1 }); // Sort by date
      console.log('✓ ReferralTransaction indexes created/verified');
    } catch (err) {
      if (err.code === 86) {
        console.log('✓ ReferralTransaction indexes already exist');
      } else throw err;
    }

    // Payment indexes
    console.log('Creating Payment indexes...');
    try {
      await Payment.collection.createIndex({ studentId: 1 });
      await Payment.collection.createIndex({ reference: 1 }, { unique: true });
      await Payment.collection.createIndex({ status: 1 });
      await Payment.collection.createIndex({ createdAt: -1 }); // Sort by date
      console.log('✓ Payment indexes created/verified');
    } catch (err) {
      if (err.code === 86) {
        console.log('✓ Payment indexes already exist');
      } else throw err;
    }

    console.log('\n✅ All indexes created/verified successfully!');

    // List all indexes for verification
    console.log('\n📋 Verifying indexes:\n');
    const collections = [
      { name: 'User', model: User },
      { name: 'Student', model: Student },
      { name: 'Referral', model: Referral },
      { name: 'ReferralProfile', model: ReferralProfile },
      { name: 'ReferralTransaction', model: ReferralTransaction },
      { name: 'Payment', model: Payment },
    ];

    for (const { name, model } of collections) {
      const indexes = await model.collection.getIndexes();
      console.log(`${name} indexes:`, Object.keys(indexes).join(', '));
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  }
}

createIndexes();
