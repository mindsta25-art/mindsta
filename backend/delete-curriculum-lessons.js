import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = "mongodb+srv://mindsta_gmailcom:mindsta123@minsta-cluster.euihjmn.mongodb.net/mindsta?retryWrites=true&w=majority&appName=minsta-cluster";

const LessonSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  subject: String,
  grade: String,
  term: String,
  curriculum: [Object],
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', LessonSchema);

const lessonsToDelete = [
  { title: "Introduction to Fractions", grade: "5", term: "First Term" },
  { title: "Creative Writing: Storytelling Basics", grade: "4", term: "First Term" },
  { title: "The Water Cycle and Weather", grade: "6", term: "Second Term" },
  { title: "Ancient Civilizations: Egypt", grade: "5", term: "Third Term" },
  { title: "Introduction to Drawing", grade: "3", term: "First Term" }
];

async function deleteLessons() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('🗑️  Deleting old curriculum lessons...\n');

    let deleteCount = 0;

    for (const lessonInfo of lessonsToDelete) {
      const result = await Lesson.deleteMany({
        title: lessonInfo.title,
        grade: lessonInfo.grade,
        term: lessonInfo.term
      });

      if (result.deletedCount > 0) {
        console.log(`✓ Deleted: "${lessonInfo.title}" (${result.deletedCount} document(s))`);
        deleteCount += result.deletedCount;
      }
    }

    console.log(`\n📊 Total deleted: ${deleteCount} lessons`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    console.log('🎉 Deletion complete!\n');

  } catch (error) {
    console.error('❌ Deletion failed:', error);
    process.exit(1);
  }
}

deleteLessons();
