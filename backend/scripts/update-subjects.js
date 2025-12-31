/**
 * Update Database Subjects - Replace all old subjects with standard ones
 * 
 * This script will:
 * 1. Find all unique subjects in the database
 * 2. Delete lessons with non-standard subjects
 * 3. Ensure standard subjects exist for all grades
 * 
 * Standard subjects:
 * - English
 * - Mathematics
 * - Science
 * - Social and Geography Studies
 * - ICT/Computing Skills
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Lesson Schema (simplified)
const LessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  content: String,
  subject: String,
  grade: String,
  order: { type: Number, default: 0 },
  difficulty: { type: String, default: 'beginner' },
  duration: { type: Number, default: 30 },
  videoUrl: String,
  imageUrl: String,
  keywords: [String],
  learningObjectives: [String],
  term: String,
  isPublished: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);

// All grades including Common Entrance
const grades = ['1', '2', '3', '4', '5', '6', 'Common Entrance'];

// Standard subjects (normalized)
const standardSubjects = [
  'English',
  'Mathematics',
  'Science',
  'Social and Geography Studies',
  'ICT/Computing Skills'
];

const subjectDetails = {
  'English': {
    icon: '📖',
    description: 'Develop reading, writing, grammar, and communication skills',
  },
  'Mathematics': {
    icon: '🔢',
    description: 'Learn numbers, arithmetic, geometry, and problem-solving skills',
  },
  'Science': {
    icon: '🔬',
    description: 'Explore the natural world through experiments and observations',
  },
  'Social and Geography Studies': {
    icon: '🗺️',
    description: 'Learn about society, culture, geography, and the world around us',
  },
  'ICT/Computing Skills': {
    icon: '💻',
    description: 'Master technology, computer basics, and digital literacy',
  },
};

async function updateSubjects() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all unique subjects
    console.log('📋 Finding all unique subjects in database...');
    const allSubjects = await Lesson.distinct('subject');
    console.log(`Found ${allSubjects.length} unique subjects:`, allSubjects);
    console.log('');

    // Step 2: Identify non-standard subjects
    const nonStandardSubjects = allSubjects.filter(
      subject => !standardSubjects.includes(subject)
    );

    if (nonStandardSubjects.length > 0) {
      console.log('🗑️  Non-standard subjects to remove:');
      nonStandardSubjects.forEach(subject => console.log(`   - ${subject}`));
      console.log('');

      // Step 3: Delete lessons with non-standard subjects
      console.log('🗑️  Deleting lessons with non-standard subjects...');
      const deleteResult = await Lesson.deleteMany({
        subject: { $in: nonStandardSubjects }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} lessons with non-standard subjects\n`);
    } else {
      console.log('✅ No non-standard subjects found\n');
    }

    // Step 4: Ensure standard subjects exist for all grades
    console.log('📚 Ensuring standard subjects exist for all grades...\n');
    let totalCreated = 0;
    let totalExisting = 0;

    for (const grade of grades) {
      console.log(`📚 Processing Grade ${grade}...`);
      
      for (const subject of standardSubjects) {
        // Check if lessons already exist for this grade/subject combination
        const existingLessons = await Lesson.countDocuments({ 
          grade, 
          subject: subject
        });

        if (existingLessons === 0) {
          // Create a sample lesson for this subject
          const details = subjectDetails[subject];
          const sampleLesson = {
            title: `Introduction to ${subject} - Grade ${grade}`,
            description: `Welcome to ${subject}! ${details.description}`,
            content: `This is an introductory lesson for ${subject} at Grade ${grade} level. Students will learn the foundational concepts and develop essential skills in this subject area.`,
            subject: subject,
            grade,
            order: 1,
            difficulty: 'beginner',
            duration: 45,
            term: 'First Term',
            isPublished: true,
            isPremium: false,
            keywords: [subject, `Grade ${grade}`, 'Introduction', 'Fundamentals'],
            learningObjectives: [
              `Understand the basics of ${subject}`,
              'Develop foundational skills',
              'Build confidence in the subject',
            ],
          };

          await Lesson.create(sampleLesson);
          console.log(`  ✅ Created lesson: ${subject}`);
          totalCreated++;
        } else {
          console.log(`  ℹ️  ${subject} already has ${existingLessons} lesson(s)`);
          totalExisting += existingLessons;
        }
      }
      console.log('');
    }

    // Step 5: Show final summary
    console.log('\n📊 Final Summary:');
    console.log(`✅ Standard subjects: ${standardSubjects.join(', ')}`);
    console.log(`✅ Total lessons created: ${totalCreated}`);
    console.log(`ℹ️  Total existing standard lessons: ${totalExisting}`);
    
    const finalSubjects = await Lesson.distinct('subject');
    console.log(`\n📚 Current subjects in database: ${finalSubjects.join(', ')}`);
    
    console.log('\n✨ Subject update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating subjects:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the update
updateSubjects();
