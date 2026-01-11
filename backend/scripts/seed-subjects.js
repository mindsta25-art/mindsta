import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../server/models/Subject.js';

dotenv.config();

const initialSubjects = [
  {
    name: 'English',
    description: 'Master reading, writing, grammar, and communication skills',
    category: 'Languages',
    icon: 'BookOpen',
    color: '#ef4444', // red
    order: 1,
  },
  {
    name: 'Mathematics',
    description: 'Build strong foundation in numbers, algebra, and problem-solving',
    category: 'Core',
    icon: 'Calculator',
    color: '#3b82f6', // blue
    order: 2,
  },
  {
    name: 'ICT/Computing Skills',
    description: 'Learn computer basics, digital literacy, and technology skills',
    category: 'Technology',
    icon: 'Monitor',
    color: '#8b5cf6', // purple
    order: 3,
  },
  {
    name: 'Science',
    description: 'Explore the natural world through biology, chemistry, and physics',
    category: 'Science',
    icon: 'Microscope',
    color: '#10b981', // green
    order: 4,
  },
  {
    name: 'Social Studies',
    description: 'Understand history, geography, civics, and cultural studies',
    category: 'Social',
    icon: 'Globe',
    color: '#f59e0b', // amber
    order: 5,
  },
];

async function seedSubjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if subjects already exist
    const existingCount = await Subject.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing subjects.`);
      const proceed = process.argv.includes('--force');
      
      if (!proceed) {
        console.log('Skipping seed. Use --force to override existing subjects.');
        await mongoose.disconnect();
        process.exit(0);
      }
      
      console.log('Removing existing subjects...');
      await Subject.deleteMany({});
    }

    console.log('Creating initial subjects...');
    const created = await Subject.insertMany(initialSubjects);
    
    console.log(`✓ Successfully created ${created.length} subjects:`);
    created.forEach(subject => {
      console.log(`  - ${subject.name} (${subject.category})`);
    });

    await mongoose.disconnect();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding subjects:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedSubjects();
