/**
 * Script to update lesson prices in the database
 * Run this to set prices for existing lessons that don't have prices
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lesson from './server/models/Lesson.js';

dotenv.config();

async function updateLessonPrices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all lessons
    const lessons = await Lesson.find({});
    console.log(`Found ${lessons.length} lessons`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const lesson of lessons) {
      // Check if lesson has no price or has the old default (1200)
      if (!lesson.price || lesson.price === 1200) {
        // Update to a default price - you should set this based on your pricing
        // For now, setting to 0 so admin must manually set prices
        lesson.price = 0;
        await lesson.save();
        updatedCount++;
        console.log(`Updated lesson: ${lesson.title} - Price set to 0`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Update complete!`);
    console.log(`   - Updated: ${updatedCount} lessons`);
    console.log(`   - Skipped: ${skippedCount} lessons (already had valid prices)`);
    console.log(`\n⚠️  Note: Lessons with price 0 will show as "Free"`);
    console.log(`   Please set proper prices in the admin panel for each lesson.\n`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error updating lesson prices:', error);
    process.exit(1);
  }
}

updateLessonPrices();
