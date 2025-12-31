/**
 * Seed Database with Standard Subjects for Each Grade
 * 
 * Each grade (1-6 and Common Entrance) will have:
 * - Mathematics
 * - English
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

// Lesson Schema (simplified for seeding)
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
}, { timestamps: true });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);

// All grades including Common Entrance
const grades = ['1', '2', '3', '4', '5', '6', 'Common Entrance'];

// Standard subjects for all grades
const subjects = [
  {
    name: 'Mathematics',
    icon: '🔢',
    description: 'Learn numbers, arithmetic, geometry, and problem-solving skills',
  },
  {
    name: 'English',
    icon: '📖',
    description: 'Develop reading, writing, grammar, and communication skills',
  },
  {
    name: 'Science',
    icon: '🔬',
    description: 'Explore the natural world through experiments and observations',
  },
  {
    name: 'Social and Geography Studies',
    icon: '🗺️',
    description: 'Learn about society, culture, geography, and the world around us',
  },
  {
    name: 'ICT/Computing Skills',
    icon: '💻',
    description: 'Master technology, computer basics, and digital literacy',
  },
];

async function seedSubjects() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let totalCreated = 0;
    let totalExisting = 0;

    for (const grade of grades) {
      console.log(`📚 Processing Grade ${grade}...`);
      
      for (const subject of subjects) {
        // Check if lessons already exist for this grade/subject combination
        const existingLessons = await Lesson.countDocuments({ 
          grade, 
          subject: subject.name 
        });

        if (existingLessons === 0) {
          // Create a sample lesson for this subject
          const sampleLesson = {
            title: `Introduction to ${subject.name} - Grade ${grade}`,
            description: `Welcome to ${subject.name}! ${subject.description}`,
            content: `This is an introductory lesson for ${subject.name} at Grade ${grade} level. Students will learn the foundational concepts and develop essential skills in this subject area.`,
            subject: subject.name,
            grade,
            order: 1,
            difficulty: 'beginner',
            duration: 45,
            keywords: [subject.name, `Grade ${grade}`, 'Introduction', 'Fundamentals'],
            learningObjectives: [
              `Understand the basics of ${subject.name}`,
              'Develop foundational skills',
              'Build confidence in the subject',
            ],
          };

          await Lesson.create(sampleLesson);
          console.log(`  ✅ Created lesson: ${subject.name}`);
          totalCreated++;
        } else {
          console.log(`  ℹ️  ${subject.name} already has ${existingLessons} lesson(s)`);
          totalExisting += existingLessons;
        }
      }
      console.log('');
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Total lessons created: ${totalCreated}`);
    console.log(`ℹ️  Total existing lessons: ${totalExisting}`);
    console.log('\n✨ Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding
seedSubjects();
