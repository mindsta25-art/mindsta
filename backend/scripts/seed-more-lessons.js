/**
 * Seed More Lessons for All Subjects
 * 
 * Adds comprehensive lessons for:
 * - Grades: 1, 2, 3, 4, 5, 6
 * - Subjects: Mathematics, English, Science, Social Studies, ICT/Computing Skills
 * - Terms: First Term, Second Term, Third Term
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Schemas
const LessonSchema = new mongoose.Schema({
  title: String,
  subject: String,
  grade: String,
  term: String,
  description: String,
  price: Number,
  duration: String,
  level: String,
  videoUrl: String,
  thumbnailUrl: String,
}, { strict: false, timestamps: true });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);

// Comprehensive lesson data
const lessonsData = [
  // MATHEMATICS - Grade 1
  {
    title: 'Numbers 1-10',
    subject: 'Mathematics',
    grade: '1',
    term: 'First Term',
    description: 'Learn to count and write numbers from 1 to 10. Practice number recognition and basic counting skills.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },
  {
    title: 'Addition and Subtraction Basics',
    subject: 'Mathematics',
    grade: '1',
    term: 'Second Term',
    description: 'Introduction to addition and subtraction using numbers up to 10. Learn basic arithmetic operations.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Shapes and Patterns',
    subject: 'Mathematics',
    grade: '1',
    term: 'Third Term',
    description: 'Identify basic shapes like circles, squares, triangles. Learn to recognize and create simple patterns.',
    price: 5000,
    duration: '40 minutes',
    level: 'Beginner',
  },

  // MATHEMATICS - Grade 2
  {
    title: 'Numbers 1-100',
    subject: 'Mathematics',
    grade: '2',
    term: 'First Term',
    description: 'Extend counting skills to 100. Learn place value for tens and ones.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Addition and Subtraction to 20',
    subject: 'Mathematics',
    grade: '2',
    term: 'Third Term',
    description: 'Master addition and subtraction with numbers up to 20. Practice word problems.',
    price: 5000,
    duration: '55 minutes',
    level: 'Beginner',
  },

  // MATHEMATICS - Grade 3
  {
    title: 'Multiplication Tables',
    subject: 'Mathematics',
    grade: '3',
    term: 'First Term',
    description: 'Learn multiplication tables from 2 to 10. Understand multiplication as repeated addition.',
    price: 5000,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Fractions Introduction',
    subject: 'Mathematics',
    grade: '3',
    term: 'Third Term',
    description: 'Introduction to fractions - halves, quarters, and thirds. Visual representation of fractions.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },

  // MATHEMATICS - Grade 4
  {
    title: 'Long Division and Multiplication',
    subject: 'Mathematics',
    grade: '4',
    term: 'First Term',
    description: 'Master long division and multi-digit multiplication. Practice with real-world problems.',
    price: 5500,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Decimals and Money',
    subject: 'Mathematics',
    grade: '4',
    term: 'Second Term',
    description: 'Learn decimal notation and money calculations. Practice with Nigerian Naira.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Geometry and Measurements',
    subject: 'Mathematics',
    grade: '4',
    term: 'Third Term',
    description: 'Learn about angles, perimeter, and area. Practice measuring with standard units.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },

  // MATHEMATICS - Grade 5
  {
    title: 'Fractions, Decimals, and Percentages',
    subject: 'Mathematics',
    grade: '5',
    term: 'First Term',
    description: 'Convert between fractions, decimals, and percentages. Solve complex problems.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Ratios and Proportions',
    subject: 'Mathematics',
    grade: '5',
    term: 'Second Term',
    description: 'Understand ratios and proportions. Apply to real-world scenarios.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Algebraic Thinking',
    subject: 'Mathematics',
    grade: '5',
    term: 'Third Term',
    description: 'Introduction to algebra with simple equations and variables.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },

  // MATHEMATICS - Grade 6
  {
    title: 'Advanced Algebra',
    subject: 'Mathematics',
    grade: '6',
    term: 'First Term',
    description: 'Solve algebraic equations with multiple variables. Learn about expressions and formulas.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },
  {
    title: 'Statistics and Probability',
    subject: 'Mathematics',
    grade: '6',
    term: 'Second Term',
    description: 'Introduction to data analysis, graphs, charts, mean, median, mode, and basic probability.',
    price: 6500,
    duration: '70 minutes',
    level: 'Advanced',
  },
  {
    title: 'Advanced Geometry',
    subject: 'Mathematics',
    grade: '6',
    term: 'Third Term',
    description: 'Study 3D shapes, volume, surface area, and coordinate geometry.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },

  // ENGLISH - Grade 1
  {
    title: 'The Alphabet and Phonics',
    subject: 'English',
    grade: '1',
    term: 'First Term',
    description: 'Learn the alphabet and basic phonics sounds. Practice letter recognition and formation.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },
  {
    title: 'Simple Words and Sentences',
    subject: 'English',
    grade: '1',
    term: 'Third Term',
    description: 'Build vocabulary with simple words. Form basic sentences.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },

  // ENGLISH - Grade 2
  {
    title: 'Reading Comprehension Basics',
    subject: 'English',
    grade: '2',
    term: 'Third Term',
    description: 'Read short stories and answer simple questions. Develop comprehension skills.',
    price: 5000,
    duration: '55 minutes',
    level: 'Beginner',
  },

  // ENGLISH - Grade 3
  {
    title: 'Grammar Fundamentals',
    subject: 'English',
    grade: '3',
    term: 'First Term',
    description: 'Learn about nouns, verbs, adjectives. Practice correct sentence structure.',
    price: 5000,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Creative Writing',
    subject: 'English',
    grade: '3',
    term: 'Second Term',
    description: 'Write short stories and descriptions. Develop creative expression skills.',
    price: 5000,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Spelling and Vocabulary',
    subject: 'English',
    grade: '3',
    term: 'Third Term',
    description: 'Expand vocabulary and improve spelling. Learn word families and patterns.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },

  // ENGLISH - Grade 4
  {
    title: 'Advanced Reading Comprehension',
    subject: 'English',
    grade: '4',
    term: 'First Term',
    description: 'Read longer texts with complex vocabulary. Analyze characters and plot.',
    price: 5500,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Essay Writing',
    subject: 'English',
    grade: '4',
    term: 'Second Term',
    description: 'Learn to write structured essays with introduction, body, and conclusion.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Poetry and Literature',
    subject: 'English',
    grade: '4',
    term: 'Third Term',
    description: 'Study different types of poetry. Learn about rhyme, rhythm, and literary devices.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },

  // ENGLISH - Grade 5
  {
    title: 'Advanced Grammar and Punctuation',
    subject: 'English',
    grade: '5',
    term: 'First Term',
    description: 'Master complex grammar rules, punctuation, and sentence types.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Oral English and Speech',
    subject: 'English',
    grade: '5',
    term: 'Second Term',
    description: 'Develop public speaking skills. Practice pronunciation and oral presentations.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Literature and Drama',
    subject: 'English',
    grade: '5',
    term: 'Third Term',
    description: 'Study plays, novels, and dramatic techniques. Learn about character development.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },

  // ENGLISH - Grade 6
  {
    title: 'Advanced Composition',
    subject: 'English',
    grade: '6',
    term: 'Second Term',
    description: 'Write formal letters, narratives, and argumentative essays with advanced techniques.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },
  {
    title: 'Literary Analysis',
    subject: 'English',
    grade: '6',
    term: 'Third Term',
    description: 'Analyze literary texts, themes, symbols, and author techniques.',
    price: 6500,
    duration: '70 minutes',
    level: 'Advanced',
  },

  // SCIENCE - Grade 1
  {
    title: 'Our Five Senses',
    subject: 'Science',
    grade: '1',
    term: 'Second Term',
    description: 'Learn about the five senses - sight, hearing, smell, taste, and touch.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },
  {
    title: 'Living and Non-Living Things',
    subject: 'Science',
    grade: '1',
    term: 'Third Term',
    description: 'Distinguish between living and non-living things. Learn basic characteristics of life.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },

  // SCIENCE - Grade 2
  {
    title: 'Plants and Animals',
    subject: 'Science',
    grade: '2',
    term: 'First Term',
    description: 'Study different types of plants and animals. Learn about their habitats.',
    price: 5000,
    duration: '55 minutes',
    level: 'Beginner',
  },
  {
    title: 'Weather and Seasons',
    subject: 'Science',
    grade: '2',
    term: 'Second Term',
    description: 'Learn about different weather conditions and seasons in Nigeria.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Water and Air',
    subject: 'Science',
    grade: '2',
    term: 'Third Term',
    description: 'Understand the importance of water and air. Learn about their properties.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },

  // SCIENCE - Grade 3
  {
    title: 'The Human Body',
    subject: 'Science',
    grade: '3',
    term: 'Second Term',
    description: 'Learn about major body systems and organs. Understand how the body works.',
    price: 5000,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Matter and Materials',
    subject: 'Science',
    grade: '3',
    term: 'Third Term',
    description: 'Study states of matter - solid, liquid, gas. Learn about material properties.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },

  // SCIENCE - Grade 4
  {
    title: 'Energy and Forces',
    subject: 'Science',
    grade: '4',
    term: 'First Term',
    description: 'Introduction to energy types and forces. Learn about motion and friction.',
    price: 5500,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'The Solar System',
    subject: 'Science',
    grade: '4',
    term: 'Second Term',
    description: 'Explore planets, stars, and our solar system. Learn about space and astronomy.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Ecosystems and Food Chains',
    subject: 'Science',
    grade: '4',
    term: 'Third Term',
    description: 'Understand ecosystems, food chains, and environmental relationships.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },

  // SCIENCE - Grade 5
  {
    title: 'Chemical Reactions',
    subject: 'Science',
    grade: '5',
    term: 'First Term',
    description: 'Introduction to chemistry and chemical reactions. Learn about acids and bases.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Electricity and Magnetism',
    subject: 'Science',
    grade: '5',
    term: 'Second Term',
    description: 'Study electrical circuits, conductors, insulators, and magnetic fields.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Human Reproduction',
    subject: 'Science',
    grade: '5',
    term: 'Third Term',
    description: 'Learn about human reproduction, puberty, and life cycles.',
    price: 6000,
    duration: '60 minutes',
    level: 'Intermediate',
  },

  // SCIENCE - Grade 6
  {
    title: 'Advanced Physics Concepts',
    subject: 'Science',
    grade: '6',
    term: 'First Term',
    description: 'Study motion, speed, velocity, and Newton\'s laws. Advanced force concepts.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },
  {
    title: 'Cell Biology',
    subject: 'Science',
    grade: '6',
    term: 'Second Term',
    description: 'Study cells, their structure, function, and processes like photosynthesis.',
    price: 6500,
    duration: '70 minutes',
    level: 'Advanced',
  },
  {
    title: 'Environmental Science',
    subject: 'Science',
    grade: '6',
    term: 'Third Term',
    description: 'Learn about environmental issues, conservation, and sustainability.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },

  // SOCIAL STUDIES - Grade 1
  {
    title: 'My Family and Home',
    subject: 'Social Studies',
    grade: '1',
    term: 'Second Term',
    description: 'Learn about family members, roles, and responsibilities in the home.',
    price: 5000,
    duration: '40 minutes',
    level: 'Beginner',
  },
  {
    title: 'My School and Community',
    subject: 'Social Studies',
    grade: '1',
    term: 'Third Term',
    description: 'Understand the school environment and local community helpers.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },

  // SOCIAL STUDIES - Grade 2
  {
    title: 'Our Local Environment',
    subject: 'Social Studies',
    grade: '2',
    term: 'First Term',
    description: 'Study the local area, landmarks, and geographical features.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Cultural Practices',
    subject: 'Social Studies',
    grade: '2',
    term: 'Second Term',
    description: 'Learn about Nigerian cultures, festivals, and traditions.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Good Citizenship',
    subject: 'Social Studies',
    grade: '2',
    term: 'Third Term',
    description: 'Understand rights, responsibilities, and values of good citizenship.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },

  // SOCIAL STUDIES - Grade 3
  {
    title: 'Nigerian States and Capitals',
    subject: 'Social Studies',
    grade: '3',
    term: 'First Term',
    description: 'Learn about the 36 states of Nigeria and their capital cities.',
    price: 5000,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Transportation and Communication',
    subject: 'Social Studies',
    grade: '3',
    term: 'Second Term',
    description: 'Study different modes of transportation and communication methods.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Our Natural Resources',
    subject: 'Social Studies',
    grade: '3',
    term: 'Third Term',
    description: 'Learn about Nigeria\'s natural resources and their uses.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },

  // SOCIAL STUDIES - Grade 4
  {
    title: 'Nigerian History',
    subject: 'Social Studies',
    grade: '4',
    term: 'First Term',
    description: 'Study pre-colonial Nigeria, early kingdoms, and empires.',
    price: 5500,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Government and Leadership',
    subject: 'Social Studies',
    grade: '4',
    term: 'Second Term',
    description: 'Learn about government systems, democracy, and leadership qualities.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Economic Activities',
    subject: 'Social Studies',
    grade: '4',
    term: 'Third Term',
    description: 'Understand trade, agriculture, industry, and economic systems.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },

  // SOCIAL STUDIES - Grade 5
  {
    title: 'Colonial Nigeria',
    subject: 'Social Studies',
    grade: '5',
    term: 'First Term',
    description: 'Study colonial period, independence movement, and key historical figures.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Nigerian Constitution',
    subject: 'Social Studies',
    grade: '5',
    term: 'Second Term',
    description: 'Learn about the Nigerian constitution, fundamental rights, and civic duties.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'International Relations',
    subject: 'Social Studies',
    grade: '5',
    term: 'Third Term',
    description: 'Study Nigeria\'s role in international organizations like UN, AU, ECOWAS.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },

  // SOCIAL STUDIES - Grade 6
  {
    title: 'World Geography',
    subject: 'Social Studies',
    grade: '6',
    term: 'First Term',
    description: 'Study continents, countries, major geographical features, and climate zones.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },
  {
    title: 'Democracy and Human Rights',
    subject: 'Social Studies',
    grade: '6',
    term: 'Second Term',
    description: 'Deep dive into democratic principles, human rights, and social justice.',
    price: 6500,
    duration: '70 minutes',
    level: 'Advanced',
  },
  {
    title: 'Conflict Resolution',
    subject: 'Social Studies',
    grade: '6',
    term: 'Third Term',
    description: 'Learn about peace-building, conflict resolution, and mediation skills.',
    price: 6500,
    duration: '70 minutes',
    level: 'Advanced',
  },

  // ICT/COMPUTING - Grade 1
  {
    title: 'Introduction to Computers',
    subject: 'ICT/Computing Skills',
    grade: '1',
    term: 'First Term',
    description: 'Learn about computers, their parts, and basic uses.',
    price: 5000,
    duration: '40 minutes',
    level: 'Beginner',
  },
  {
    title: 'Using a Mouse and Keyboard',
    subject: 'ICT/Computing Skills',
    grade: '1',
    term: 'Second Term',
    description: 'Practice using mouse clicks and basic keyboard typing.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },
  {
    title: 'Computer Safety',
    subject: 'ICT/Computing Skills',
    grade: '1',
    term: 'Third Term',
    description: 'Learn basic computer safety and care for devices.',
    price: 5000,
    duration: '40 minutes',
    level: 'Beginner',
  },

  // ICT/COMPUTING - Grade 2
  {
    title: 'Basic Word Processing',
    subject: 'ICT/Computing Skills',
    grade: '2',
    term: 'First Term',
    description: 'Introduction to typing simple words and sentences.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Drawing with Paint',
    subject: 'ICT/Computing Skills',
    grade: '2',
    term: 'Second Term',
    description: 'Create simple drawings using paint software.',
    price: 5000,
    duration: '50 minutes',
    level: 'Beginner',
  },
  {
    title: 'Internet Basics',
    subject: 'ICT/Computing Skills',
    grade: '2',
    term: 'Third Term',
    description: 'Introduction to the internet and online safety for kids.',
    price: 5000,
    duration: '45 minutes',
    level: 'Beginner',
  },

  // ICT/COMPUTING - Grade 3
  {
    title: 'Microsoft Word Basics',
    subject: 'ICT/Computing Skills',
    grade: '3',
    term: 'First Term',
    description: 'Learn to create, edit, and save documents in Microsoft Word.',
    price: 5000,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Introduction to Spreadsheets',
    subject: 'ICT/Computing Skills',
    grade: '3',
    term: 'Second Term',
    description: 'Basic Excel skills - entering data and simple formulas.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Email and Online Communication',
    subject: 'ICT/Computing Skills',
    grade: '3',
    term: 'Third Term',
    description: 'Learn to send emails and communicate safely online.',
    price: 5000,
    duration: '55 minutes',
    level: 'Intermediate',
  },

  // ICT/COMPUTING - Grade 4
  {
    title: 'PowerPoint Presentations',
    subject: 'ICT/Computing Skills',
    grade: '4',
    term: 'First Term',
    description: 'Create engaging presentations with slides, images, and animations.',
    price: 5500,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Internet Research Skills',
    subject: 'ICT/Computing Skills',
    grade: '4',
    term: 'Second Term',
    description: 'Learn to search effectively online and evaluate information sources.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Digital Citizenship',
    subject: 'ICT/Computing Skills',
    grade: '4',
    term: 'Third Term',
    description: 'Understand online behavior, cyberbullying prevention, and digital rights.',
    price: 5500,
    duration: '60 minutes',
    level: 'Intermediate',
  },

  // ICT/COMPUTING - Grade 5
  {
    title: 'Advanced Spreadsheets',
    subject: 'ICT/Computing Skills',
    grade: '5',
    term: 'First Term',
    description: 'Master Excel formulas, charts, and data analysis.',
    price: 6000,
    duration: '70 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Introduction to Coding',
    subject: 'ICT/Computing Skills',
    grade: '5',
    term: 'Second Term',
    description: 'Learn basic programming concepts using Scratch or block-based coding.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },
  {
    title: 'Multimedia and Graphics',
    subject: 'ICT/Computing Skills',
    grade: '5',
    term: 'Third Term',
    description: 'Create digital content with images, audio, and video editing basics.',
    price: 6000,
    duration: '65 minutes',
    level: 'Intermediate',
  },

  // ICT/COMPUTING - Grade 6
  {
    title: 'Web Development Basics',
    subject: 'ICT/Computing Skills',
    grade: '6',
    term: 'First Term',
    description: 'Introduction to HTML and creating simple web pages.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },
  {
    title: 'Database Management',
    subject: 'ICT/Computing Skills',
    grade: '6',
    term: 'Second Term',
    description: 'Learn about databases, tables, and basic queries using Access.',
    price: 6500,
    duration: '70 minutes',
    level: 'Advanced',
  },
  {
    title: 'Advanced Programming',
    subject: 'ICT/Computing Skills',
    grade: '6',
    term: 'Third Term',
    description: 'Move to text-based programming with Python or JavaScript basics.',
    price: 6500,
    duration: '75 minutes',
    level: 'Advanced',
  },
];

async function seedLessons() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📚 Seeding lessons...\n');

    let created = 0;
    let skipped = 0;

    for (const lessonData of lessonsData) {
      // Check if lesson already exists
      const existing = await Lesson.findOne({
        subject: lessonData.subject,
        grade: lessonData.grade,
        term: lessonData.term,
        title: lessonData.title,
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${lessonData.subject} - Grade ${lessonData.grade} - ${lessonData.term} - ${lessonData.title}`);
        skipped++;
      } else {
        await Lesson.create(lessonData);
        console.log(`✅ Created: ${lessonData.subject} - Grade ${lessonData.grade} - ${lessonData.term} - ${lessonData.title}`);
        created++;
      }
    }

    console.log('\n============================================================');
    console.log('📊 Summary:');
    console.log(`✅ Lessons created: ${created}`);
    console.log(`⏭️  Lessons skipped (already exist): ${skipped}`);
    console.log(`📚 Total lessons processed: ${lessonsData.length}`);
    console.log('============================================================\n');

    console.log('✨ Lesson seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding lessons:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Database connection closed');
    await mongoose.connection.close();
  }
}

seedLessons();
