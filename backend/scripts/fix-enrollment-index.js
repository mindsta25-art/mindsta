/**
 * Migration: fix-enrollment-index.js
 *
 * Drops the old unique compound index (userId, subject, grade, term) on the
 * enrollments collection so that multiple per-lesson enrollments can coexist
 * for the same subject+grade+term.
 *
 * Run once:  node backend/scripts/fix-enrollment-index.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MONGODB_URI / MONGO_URI env variable not set.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('enrollments');

  // List existing indexes so we know what to drop
  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  const OLD_INDEX = 'userId_1_subject_1_grade_1_term_1';

  if (indexes.some(i => i.name === OLD_INDEX)) {
    await collection.dropIndex(OLD_INDEX);
    console.log(`✅ Dropped old unique index: ${OLD_INDEX}`);
  } else {
    console.log(`ℹ️  Old index "${OLD_INDEX}" not found (already dropped or never created).`);
  }

  // The new index (userId, subject, grade, term, lessonId) will be created automatically
  // the next time the server starts (Mongoose autoIndex).
  console.log('✅ Done. Restart the backend server to create the new index.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
