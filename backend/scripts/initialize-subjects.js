import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SubjectSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  icon: String,
  color: String,
  isActive: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
});

const Subject = mongoose.model('Subject', SubjectSchema);

const defaultSubjects = [
  {
    name: 'English',
    category: 'Languages',
    description: 'Master reading, writing, grammar, and communication skills',
    icon: 'BookOpen',
    color: 'blue',
    isActive: true,
    order: 1
  },
  {
    name: 'Mathematics',
    category: 'Core',
    description: 'Build strong foundations in numbers, algebra, and problem-solving',
    icon: 'Calculator',
    color: 'purple',
    isActive: true,
    order: 2
  },
  {
    name: 'ICT/Computing Skills',
    category: 'Technology',
    description: 'Learn computer basics, coding, and digital literacy',
    icon: 'Computer',
    color: 'green',
    isActive: true,
    order: 3
  },
  {
    name: 'Science',
    category: 'Science',
    description: 'Explore the wonders of physics, chemistry, and biology',
    icon: 'Flask',
    color: 'teal',
    isActive: true,
    order: 4
  },
  {
    name: 'Social Studies',
    category: 'Social',
    description: 'Understand history, geography, and social sciences',
    icon: 'Globe',
    color: 'orange',
    isActive: true,
    order: 5
  }
];

async function initializeSubjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing subjects
    const existingCount = await Subject.countDocuments();
    console.log(`Found ${existingCount} existing subjects`);

    console.log('\nInitializing default subjects...');
    
    for (const subjectData of defaultSubjects) {
      const existing = await Subject.findOne({ name: subjectData.name });
      
      if (existing) {
        console.log(`✓ Subject "${subjectData.name}" already exists, updating...`);
        await Subject.updateOne({ name: subjectData.name }, subjectData);
      } else {
        console.log(`✓ Creating subject "${subjectData.name}"...`);
        await Subject.create(subjectData);
      }
    }

    console.log('\n✓ Subjects initialized successfully!');
    console.log('\nInitialized subjects:');
    const subjects = await Subject.find().sort({ order: 1 });
    subjects.forEach(s => {
      console.log(`  - ${s.name} (${s.category}) - ${s.isActive ? 'Active' : 'Inactive'}`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing subjects:', error);
    process.exit(1);
  }
}

initializeSubjects();
