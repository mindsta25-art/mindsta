/**
 * Migration script to add subject, grade, and term fields to existing quizzes
 * This script populates the new required fields from the associated lesson
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindsta';

async function migrateQuizzes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const quizzesCollection = db.collection('quizzes');
    const lessonsCollection = db.collection('lessons');

    // Find all quizzes that don't have subject, grade, or term fields
    const quizzesToMigrate = await quizzesCollection.find({
      $or: [
        { subject: { $exists: false } },
        { grade: { $exists: false } },
        { term: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${quizzesToMigrate.length} quizzes to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const quiz of quizzesToMigrate) {
      try {
        // Find the associated lesson
        const lesson = await lessonsCollection.findOne({ _id: quiz.lessonId });

        if (!lesson) {
          console.warn(`Warning: No lesson found for quiz ${quiz._id}, lessonId: ${quiz.lessonId}`);
          errorCount++;
          continue;
        }

        // Update the quiz with subject, grade, and term from the lesson
        await quizzesCollection.updateOne(
          { _id: quiz._id },
          {
            $set: {
              subject: lesson.subject,
              grade: lesson.grade,
              term: lesson.term
            }
          }
        );

        successCount++;
        console.log(`✓ Migrated quiz "${quiz.title}" - ${lesson.subject}, Grade ${lesson.grade}, ${lesson.term}`);
      } catch (error) {
        console.error(`Error migrating quiz ${quiz._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total quizzes processed: ${quizzesToMigrate.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    // Verify the migration
    const remainingQuizzes = await quizzesCollection.countDocuments({
      $or: [
        { subject: { $exists: false } },
        { grade: { $exists: false } },
        { term: { $exists: false } }
      ]
    });

    if (remainingQuizzes === 0) {
      console.log('\n✓ All quizzes have been successfully migrated!');
    } else {
      console.log(`\n⚠ Warning: ${remainingQuizzes} quizzes still need migration`);
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the migration
migrateQuizzes().catch(console.error);
