/**
 * Seed All Quizzes for All Subjects and Grades
 * 
 * Creates comprehensive quizzes for:
 * - Grades: 1, 2, 3, 4, 5, 6, and Common Entrance
 * - Subjects: Mathematics, English, Science, Social and Geography Studies, ICT/Computing Skills
 * - Terms: First Term, Second Term, Third Term
 * 
 * Each quiz has 10 questions with a 10-minute time limit and 80% passing score.
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
}, { strict: false, timestamps: true });

const QuizSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, required: true },
  }],
  passingScore: { type: Number, default: 80 },
  timeLimit: { type: Number, default: 600 },
}, { timestamps: true });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

// Quiz templates for each subject (10 questions each)
const quizTemplates = {
  'Mathematics': {
    'Grade 1': [
      { q: 'What is 2 + 3?', opts: ['4', '5', '6', '7'], correct: 1, exp: '2 + 3 = 5' },
      { q: 'What is 10 - 4?', opts: ['5', '6', '7', '8'], correct: 1, exp: '10 - 4 = 6' },
      { q: 'Which number comes after 7?', opts: ['6', '8', '9', '10'], correct: 1, exp: '8 comes after 7' },
      { q: 'How many sides does a triangle have?', opts: ['2', '3', '4', '5'], correct: 1, exp: 'A triangle has 3 sides' },
      { q: 'What is 5 + 5?', opts: ['8', '10', '12', '15'], correct: 1, exp: '5 + 5 = 10' },
      { q: 'Which is the smallest number?', opts: ['5', '2', '8', '9'], correct: 1, exp: '2 is the smallest among these numbers' },
      { q: 'What is 8 - 3?', opts: ['4', '5', '6', '7'], correct: 1, exp: '8 - 3 = 5' },
      { q: 'How many fingers do you have on both hands?', opts: ['5', '10', '15', '20'], correct: 1, exp: 'You have 10 fingers on both hands' },
      { q: 'What is 4 + 4?', opts: ['6', '8', '10', '12'], correct: 1, exp: '4 + 4 = 8' },
      { q: 'Which number is bigger: 9 or 6?', opts: ['6', '9', 'Same', 'Neither'], correct: 1, exp: '9 is bigger than 6' }
    ],
    'Grade 2': [
      { q: 'What is 15 + 8?', opts: ['21', '23', '25', '27'], correct: 1, exp: '15 + 8 = 23' },
      { q: 'What is 20 - 12?', opts: ['6', '8', '10', '12'], correct: 1, exp: '20 - 12 = 8' },
      { q: 'What is 3 × 4?', opts: ['10', '12', '14', '16'], correct: 1, exp: '3 × 4 = 12' },
      { q: 'How many sides does a square have?', opts: ['3', '4', '5', '6'], correct: 1, exp: 'A square has 4 sides' },
      { q: 'What is half of 20?', opts: ['8', '10', '12', '15'], correct: 1, exp: 'Half of 20 is 10' },
      { q: 'What is 25 + 15?', opts: ['35', '40', '45', '50'], correct: 1, exp: '25 + 15 = 40' },
      { q: 'What is 2 × 5?', opts: ['8', '10', '12', '15'], correct: 1, exp: '2 × 5 = 10' },
      { q: 'What is 18 - 9?', opts: ['7', '9', '11', '13'], correct: 1, exp: '18 - 9 = 9' },
      { q: 'How many cents in one dollar?', opts: ['50', '100', '150', '200'], correct: 1, exp: 'There are 100 cents in one dollar' },
      { q: 'What is 6 × 2?', opts: ['10', '12', '14', '16'], correct: 1, exp: '6 × 2 = 12' }
    ],
    'default': [
      { q: 'What is 12 + 18?', opts: ['28', '30', '32', '34'], correct: 1, exp: '12 + 18 = 30' },
      { q: 'What is 45 - 27?', opts: ['16', '18', '20', '22'], correct: 1, exp: '45 - 27 = 18' },
      { q: 'What is 8 × 7?', opts: ['54', '56', '58', '60'], correct: 1, exp: '8 × 7 = 56' },
      { q: 'What is 36 ÷ 6?', opts: ['4', '6', '8', '9'], correct: 1, exp: '36 ÷ 6 = 6' },
      { q: 'What is 25% of 100?', opts: ['20', '25', '30', '35'], correct: 1, exp: '25% of 100 = 25' },
      { q: 'What is the perimeter of a square with side 5?', opts: ['15', '20', '25', '30'], correct: 1, exp: 'Perimeter = 4 × 5 = 20' },
      { q: 'What is 9 × 9?', opts: ['72', '81', '90', '99'], correct: 1, exp: '9 × 9 = 81' },
      { q: 'What is 144 ÷ 12?', opts: ['10', '12', '14', '16'], correct: 1, exp: '144 ÷ 12 = 12' },
      { q: 'What is 50% of 80?', opts: ['35', '40', '45', '50'], correct: 1, exp: '50% of 80 = 40' },
      { q: 'How many degrees in a right angle?', opts: ['45', '90', '180', '360'], correct: 1, exp: 'A right angle is 90 degrees' }
    ]
  },
  'English': {
    'Grade 1': [
      { q: 'Which letter comes after B?', opts: ['A', 'C', 'D', 'E'], correct: 1, exp: 'C comes after B in the alphabet' },
      { q: 'Which of these is a vowel?', opts: ['B', 'A', 'D', 'F'], correct: 1, exp: 'A is a vowel. The vowels are A, E, I, O, U' },
      { q: 'What is the first letter of "cat"?', opts: ['A', 'C', 'T', 'K'], correct: 1, exp: 'Cat starts with the letter C' },
      { q: 'How many vowels are there?', opts: ['4', '5', '6', '7'], correct: 1, exp: 'There are 5 vowels: A, E, I, O, U' },
      { q: 'What is the opposite of "big"?', opts: ['huge', 'small', 'large', 'tall'], correct: 1, exp: 'Small is the opposite of big' },
      { q: 'Which is a color?', opts: ['run', 'red', 'cat', 'book'], correct: 1, exp: 'Red is a color' },
      { q: 'What is the last letter of "dog"?', opts: ['d', 'o', 'g', 'a'], correct: 2, exp: 'Dog ends with the letter G' },
      { q: 'Which word rhymes with "cat"?', opts: ['dog', 'hat', 'cup', 'car'], correct: 1, exp: 'Hat rhymes with cat' },
      { q: 'How many letters in "sun"?', opts: ['2', '3', '4', '5'], correct: 1, exp: 'Sun has 3 letters: S-U-N' },
      { q: 'Which is an animal?', opts: ['table', 'fish', 'book', 'pen'], correct: 1, exp: 'Fish is an animal' }
    ],
    'default': [
      { q: 'What is a noun?', opts: ['Action word', 'Naming word', 'Describing word', 'Joining word'], correct: 1, exp: 'A noun is a naming word for people, places, or things' },
      { q: 'What is the plural of "child"?', opts: ['childs', 'children', 'childes', 'childrens'], correct: 1, exp: 'The plural of child is children' },
      { q: 'Which is a verb?', opts: ['beautiful', 'run', 'table', 'happy'], correct: 1, exp: 'Run is a verb (action word)' },
      { q: 'What punctuation ends a question?', opts: ['.', '?', '!', ','], correct: 1, exp: 'Questions end with a question mark (?)' },
      { q: 'Which is the correct spelling?', opts: ['recieve', 'receive', 'receve', 'receeve'], correct: 1, exp: 'The correct spelling is "receive"' },
      { q: 'What is an adjective?', opts: ['Action word', 'Naming word', 'Describing word', 'Joining word'], correct: 2, exp: 'An adjective is a describing word' },
      { q: 'Which sentence is correct?', opts: ['He go to school', 'He goes to school', 'He going to school', 'He gone to school'], correct: 1, exp: '"He goes to school" is grammatically correct' },
      { q: 'What is a synonym for "happy"?', opts: ['sad', 'joyful', 'angry', 'tired'], correct: 1, exp: 'Joyful is a synonym (similar meaning) for happy' },
      { q: 'Which word is a pronoun?', opts: ['book', 'she', 'run', 'blue'], correct: 1, exp: '"She" is a pronoun (replaces a noun)' },
      { q: 'What is the past tense of "eat"?', opts: ['eated', 'ate', 'eaten', 'eating'], correct: 1, exp: 'The past tense of eat is ate' }
    ]
  },
  'Science': {
    'Grade 1': [
      { q: 'Which is a living thing?', opts: ['rock', 'tree', 'water', 'air'], correct: 1, exp: 'A tree is a living thing because it grows and breathes' },
      { q: 'How many legs does a spider have?', opts: ['6', '8', '10', '12'], correct: 1, exp: 'Spiders have 8 legs' },
      { q: 'What do plants need to grow?', opts: ['darkness', 'sunlight', 'cold', 'stone'], correct: 1, exp: 'Plants need sunlight to make food and grow' },
      { q: 'Which animal can fly?', opts: ['dog', 'bird', 'fish', 'cat'], correct: 1, exp: 'Birds can fly using their wings' },
      { q: 'What color is the sky on a sunny day?', opts: ['red', 'blue', 'green', 'yellow'], correct: 1, exp: 'The sky is blue on a sunny day' },
      { q: 'Which sense do you use to smell?', opts: ['eyes', 'nose', 'ears', 'tongue'], correct: 1, exp: 'You use your nose to smell' },
      { q: 'Which is NOT a season?', opts: ['Spring', 'Summer', 'Monday', 'Winter'], correct: 2, exp: 'Monday is a day of the week, not a season' },
      { q: 'What do fish use to breathe?', opts: ['lungs', 'gills', 'nose', 'mouth'], correct: 1, exp: 'Fish use gills to breathe underwater' },
      { q: 'Which gives us milk?', opts: ['chicken', 'cow', 'horse', 'pig'], correct: 1, exp: 'Cows give us milk' },
      { q: 'What is water when it freezes?', opts: ['steam', 'ice', 'vapor', 'rain'], correct: 1, exp: 'Water becomes ice when it freezes' }
    ],
    'default': [
      { q: 'What is the center of an atom called?', opts: ['electron', 'nucleus', 'proton', 'neutron'], correct: 1, exp: 'The nucleus is the center of an atom' },
      { q: 'What gas do plants produce?', opts: ['nitrogen', 'oxygen', 'carbon dioxide', 'hydrogen'], correct: 1, exp: 'Plants produce oxygen through photosynthesis' },
      { q: 'What is the largest planet?', opts: ['Earth', 'Jupiter', 'Mars', 'Saturn'], correct: 1, exp: 'Jupiter is the largest planet in our solar system' },
      { q: 'What is H2O?', opts: ['air', 'water', 'salt', 'sugar'], correct: 1, exp: 'H2O is the chemical formula for water' },
      { q: 'What is photosynthesis?', opts: ['breathing', 'eating', 'making food from sunlight', 'sleeping'], correct: 2, exp: 'Photosynthesis is how plants make food using sunlight' },
      { q: 'How many bones in the human body?', opts: ['106', '206', '306', '406'], correct: 1, exp: 'The human body has 206 bones' },
      { q: 'What force pulls objects down?', opts: ['magnetism', 'gravity', 'friction', 'electricity'], correct: 1, exp: 'Gravity pulls objects toward Earth' },
      { q: 'What is the boiling point of water?', opts: ['50°C', '100°C', '150°C', '200°C'], correct: 1, exp: 'Water boils at 100°C (212°F)' },
      { q: 'What is the fastest land animal?', opts: ['lion', 'cheetah', 'horse', 'dog'], correct: 1, exp: 'The cheetah is the fastest land animal' },
      { q: 'What planet is known as the Red Planet?', opts: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1, exp: 'Mars is called the Red Planet due to its reddish appearance' }
    ]
  },
  'Social and Geography Studies': {
    'default': [
      { q: 'What is the capital city of your country?', opts: ['Port of Spain', 'Lagos', 'Accra', 'Kingston'], correct: 0, exp: 'The capital varies by country' },
      { q: 'How many continents are there?', opts: ['5', '7', '6', '8'], correct: 1, exp: 'There are 7 continents on Earth' },
      { q: 'What is the largest ocean?', opts: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correct: 1, exp: 'The Pacific Ocean is the largest ocean' },
      { q: 'Which direction does the sun rise?', opts: ['North', 'East', 'South', 'West'], correct: 1, exp: 'The sun rises in the East' },
      { q: 'What is a map?', opts: ['A book', 'A drawing of an area', 'A compass', 'A globe'], correct: 1, exp: 'A map is a drawing that shows an area from above' },
      { q: 'Which is a natural resource?', opts: ['plastic', 'water', 'glass', 'paper'], correct: 1, exp: 'Water is a natural resource found in nature' },
      { q: 'What do we call people who study the past?', opts: ['scientists', 'historians', 'artists', 'doctors'], correct: 1, exp: 'Historians study the past' },
      { q: 'Which is a form of transportation?', opts: ['house', 'bus', 'tree', 'book'], correct: 1, exp: 'A bus is a form of transportation' },
      { q: 'What is culture?', opts: ['Food only', 'Way of life', 'Language only', 'Music only'], correct: 1, exp: 'Culture is the way of life of a group of people' },
      { q: 'Which is a continent?', opts: ['Canada', 'Africa', 'Brazil', 'Japan'], correct: 1, exp: 'Africa is a continent' }
    ]
  },
  'ICT/Computing Skills': {
    'Grade 1': [
      { q: 'What do you use to type on a computer?', opts: ['mouse', 'keyboard', 'screen', 'printer'], correct: 1, exp: 'You use a keyboard to type on a computer' },
      { q: 'What do you click with?', opts: ['keyboard', 'mouse', 'speaker', 'webcam'], correct: 1, exp: 'You click with a mouse' },
      { q: 'What shows pictures on a computer?', opts: ['keyboard', 'screen', 'mouse', 'printer'], correct: 1, exp: 'The screen (monitor) shows pictures' },
      { q: 'What makes a computer print on paper?', opts: ['mouse', 'printer', 'speaker', 'keyboard'], correct: 1, exp: 'A printer prints on paper' },
      { q: 'What do you use to listen to sounds?', opts: ['mouse', 'speakers', 'keyboard', 'screen'], correct: 1, exp: 'Speakers let you hear sounds from the computer' },
      { q: 'Which key has a picture of an arrow?', opts: ['space bar', 'arrow key', 'enter key', 'shift key'], correct: 1, exp: 'Arrow keys have arrow symbols' },
      { q: 'What do you press to make a space?', opts: ['enter', 'space bar', 'shift', 'delete'], correct: 1, exp: 'The space bar makes a space between words' },
      { q: 'What stores information in a computer?', opts: ['screen', 'memory', 'mouse', 'keyboard'], correct: 1, exp: 'Memory stores information' },
      { q: 'What is software?', opts: ['mouse', 'programs', 'keyboard', 'screen'], correct: 1, exp: 'Software means computer programs' },
      { q: 'What connects to the internet?', opts: ['printer', 'modem/wifi', 'speaker', 'keyboard'], correct: 1, exp: 'A modem or wifi connects to the internet' }
    ],
    'default': [
      { q: 'What does CPU stand for?', opts: ['Computer Personal Unit', 'Central Processing Unit', 'Central Program Utility', 'Computer Power Unit'], correct: 1, exp: 'CPU stands for Central Processing Unit' },
      { q: 'What is RAM?', opts: ['Read Access Memory', 'Random Access Memory', 'Run All Memory', 'Read All Memory'], correct: 1, exp: 'RAM stands for Random Access Memory' },
      { q: 'What is the brain of the computer?', opts: ['Monitor', 'CPU', 'Keyboard', 'Mouse'], correct: 1, exp: 'The CPU is considered the brain of the computer' },
      { q: 'What does WWW stand for?', opts: ['World Wide Web', 'World Web Wide', 'Web World Wide', 'Wide World Web'], correct: 0, exp: 'WWW stands for World Wide Web' },
      { q: 'What is an operating system?', opts: ['Hardware', 'Software that runs the computer', 'A game', 'A website'], correct: 1, exp: 'An operating system is software that manages the computer' },
      { q: 'What is a file extension?', opts: ['File size', 'Letters after the dot in filename', 'File color', 'File name'], correct: 1, exp: 'File extension is the letters after the dot (e.g., .txt, .pdf)' },
      { q: 'What does saving a file do?', opts: ['Deletes it', 'Stores it', 'Prints it', 'Opens it'], correct: 1, exp: 'Saving stores a file on the computer' },
      { q: 'What is a folder used for?', opts: ['Deleting files', 'Organizing files', 'Printing files', 'Creating files'], correct: 1, exp: 'Folders help organize and group files' },
      { q: 'What is a browser?', opts: ['Game', 'Program to access internet', 'Operating system', 'Printer'], correct: 1, exp: 'A browser is a program used to access websites' },
      { q: 'What does Ctrl+C do?', opts: ['Cut', 'Copy', 'Paste', 'Delete'], correct: 1, exp: 'Ctrl+C copies selected text or items' }
    ]
  }
};

async function generateQuiz(subject, grade, lesson) {
  const gradeKey = `Grade ${grade}`;
  const template = quizTemplates[subject]?.[gradeKey] || quizTemplates[subject]?.['default'] || quizTemplates['Science']['default'];
  
  const questions = template.map(item => ({
    question: item.q,
    options: item.opts,
    correctAnswer: item.correct,
    explanation: item.exp
  }));

  return {
    lessonId: lesson._id,
    title: `${subject} Quiz - ${lesson.term}`,
    description: `Test your knowledge of ${subject} for Grade ${grade} - ${lesson.term}`,
    questions,
    passingScore: 80,
    timeLimit: 600
  };
}

async function seedAllQuizzes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📚 Fetching all lessons...');
    const lessons = await Lesson.find({}).lean();
    console.log(`Found ${lessons.length} lessons\n`);

    if (lessons.length === 0) {
      console.log('⚠️  No lessons found. Please run seed-subjects-with-terms.js first');
      return;
    }

    let created = 0;
    let skipped = 0;

    console.log('🎯 Creating quizzes...\n');

    for (const lesson of lessons) {
      // Check if quiz already exists
      const existingQuiz = await Quiz.findOne({ lessonId: lesson._id });
      
      if (existingQuiz) {
        console.log(`⏭️  Skipped: ${lesson.subject} - Grade ${lesson.grade} - ${lesson.term} (quiz exists)`);
        skipped++;
        continue;
      }

      const quizData = await generateQuiz(lesson.subject, lesson.grade, lesson);
      await Quiz.create(quizData);
      console.log(`✅ Created: ${lesson.subject} - Grade ${lesson.grade} - ${lesson.term}`);
      created++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`✅ Quizzes created: ${created}`);
    console.log(`⏭️  Quizzes skipped (already exist): ${skipped}`);
    console.log(`📚 Total lessons processed: ${lessons.length}`);
    console.log('='.repeat(60));
    console.log('\n✨ Quiz seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

seedAllQuizzes();
