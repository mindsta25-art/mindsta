/**
 * Seed Database with Complete Test Content
 * Creates subjects, lessons, and quizzes for testing
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
  description: String,
  content: String,
  subject: String,
  grade: String,
  term: { type: String, enum: ['First Term', 'Second Term', 'Third Term'] },
  order: { type: Number, default: 0 },
  difficulty: { type: String, default: 'beginner' },
  duration: { type: Number, default: 30 },
  videoUrl: String,
  imageUrl: String,
  keywords: [String],
  learningObjectives: [String],
}, { timestamps: true });

const QuizSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  title: String,
  description: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
  }],
  passingScore: { type: Number, default: 80 },
  timeLimit: { type: Number, default: 600 }, // 10 minutes
}, { timestamps: true });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

// Sample content for different subjects
const lessonTemplates = {
  Mathematics: {
    'Grade 1': {
      title: 'Counting and Numbers 1-10',
      description: 'Learn to count from 1 to 10 and recognize numbers',
      content: `# Counting and Numbers 1-10

## Learning Objectives
- Count from 1 to 10
- Recognize and write numbers
- Understand number order

## Let's Count!

**One (1)** 🌟
**Two (2)** 🌟🌟
**Three (3)** 🌟🌟🌟
**Four (4)** 🌟🌟🌟🌟
**Five (5)** 🌟🌟🌟🌟🌟

## Practice Counting
Count these objects:
- 🍎🍎🍎 = 3 apples
- 🚗🚗 = 2 cars
- 🎈🎈🎈🎈🎈 = 5 balloons

## Number Writing
Practice writing each number:
1. Trace: **1** **2** **3** **4** **5**
2. Write on your own!

Great job! Keep practicing!`,
      quiz: {
        title: 'Counting Quiz',
        questions: [
          {
            question: 'How many stars are here? ⭐⭐⭐',
            options: ['2', '3', '4', '5'],
            correctAnswer: 1,
            explanation: 'There are 3 stars!'
          },
          {
            question: 'What number comes after 4?',
            options: ['3', '5', '6', '7'],
            correctAnswer: 1,
            explanation: 'The number 5 comes after 4'
          },
          {
            question: 'Count the apples: 🍎🍎🍎🍎🍎',
            options: ['4', '5', '6', '3'],
            correctAnswer: 1,
            explanation: 'There are 5 apples'
          },
          {
            question: 'Which number is the smallest?',
            options: ['10', '1', '5', '7'],
            correctAnswer: 1,
            explanation: '1 is the smallest number'
          },
          {
            question: 'What comes before 3?',
            options: ['1', '2', '4', '5'],
            correctAnswer: 1,
            explanation: 'The number 2 comes before 3'
          }
        ]
      }
    },
    'Grade 3': {
      title: 'Addition and Subtraction',
      description: 'Master basic addition and subtraction',
      content: `# Addition and Subtraction

## Addition (+)
Adding means putting numbers together!

**Examples:**
- 5 + 3 = 8
- 10 + 7 = 17
- 25 + 15 = 40

## Subtraction (-)
Subtracting means taking away!

**Examples:**
- 10 - 3 = 7
- 15 - 5 = 10
- 30 - 12 = 18

## Practice Problems
1. 8 + 6 = ?
2. 20 - 8 = ?
3. 15 + 9 = ?
4. 25 - 13 = ?

## Word Problems
- John has 12 candies. He eats 5. How many are left?
- Sarah has 8 books. She gets 7 more. How many total?

Keep practicing to become a math master! 🌟`,
      quiz: {
        title: 'Addition and Subtraction Quiz',
        questions: [
          {
            question: 'What is 7 + 5?',
            options: ['10', '12', '13', '11'],
            correctAnswer: 1,
            explanation: '7 + 5 = 12'
          },
          {
            question: 'What is 15 - 8?',
            options: ['6', '7', '8', '9'],
            correctAnswer: 1,
            explanation: '15 - 8 = 7'
          },
          {
            question: 'If you have 20 apples and give away 12, how many are left?',
            options: ['7', '8', '9', '10'],
            correctAnswer: 1,
            explanation: '20 - 12 = 8 apples left'
          },
          {
            question: 'What is 25 + 15?',
            options: ['35', '40', '45', '50'],
            correctAnswer: 1,
            explanation: '25 + 15 = 40'
          },
          {
            question: 'What is 30 - 17?',
            options: ['12', '13', '14', '15'],
            correctAnswer: 1,
            explanation: '30 - 17 = 13'
          }
        ]
      }
    }
  },
  English: {
    'Grade 1': {
      title: 'The Alphabet',
      description: 'Learn the letters A to Z',
      content: `# The Alphabet

## Let's Learn the ABCs! 🎵

### Vowels (Special Letters)
**A E I O U**

### All Letters
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z

### Uppercase and Lowercase
- **Aa** - Apple 🍎
- **Bb** - Ball ⚽
- **Cc** - Cat 🐱
- **Dd** - Dog 🐕
- **Ee** - Elephant 🐘

## Practice
Can you write your name using these letters?

Remember: Practice makes perfect! ✨`,
      quiz: {
        title: 'Alphabet Quiz',
        questions: [
          {
            question: 'Which letter comes after B?',
            options: ['A', 'C', 'D', 'E'],
            correctAnswer: 1,
            explanation: 'C comes after B in the alphabet'
          },
          {
            question: 'Which of these is a vowel?',
            options: ['B', 'A', 'D', 'F'],
            correctAnswer: 1,
            explanation: 'A is a vowel. The vowels are A, E, I, O, U'
          },
          {
            question: 'What is the first letter of the alphabet?',
            options: ['B', 'A', 'C', 'Z'],
            correctAnswer: 1,
            explanation: 'A is the first letter of the alphabet'
          },
          {
            question: 'How many vowels are there?',
            options: ['4', '5', '6', '3'],
            correctAnswer: 1,
            explanation: 'There are 5 vowels: A, E, I, O, U'
          },
          {
            question: 'What comes before M?',
            options: ['K', 'L', 'N', 'O'],
            correctAnswer: 1,
            explanation: 'L comes before M in the alphabet'
          }
        ]
      }
    },
    'Grade 3': {
      title: 'Nouns and Verbs',
      description: 'Understanding parts of speech',
      content: `# Nouns and Verbs

## Nouns (Naming Words)
A noun is a word for a person, place, or thing.

**Examples:**
- **People:** teacher, student, doctor, friend
- **Places:** school, park, home, library
- **Things:** book, chair, computer, ball

## Verbs (Action Words)
A verb is a word that shows action.

**Examples:**
- run, jump, sing, dance
- eat, sleep, write, read
- play, think, laugh, cry

## Practice Sentences
Find the nouns and verbs:
1. The **dog** runs in the **park**.
2. My **sister** reads a **book**.
3. The **children** play with their **toys**.

Great work learning grammar! 📚`,
      quiz: {
        title: 'Nouns and Verbs Quiz',
        questions: [
          {
            question: 'Which word is a noun?',
            options: ['run', 'table', 'quickly', 'happy'],
            correctAnswer: 1,
            explanation: 'Table is a noun (a thing)'
          },
          {
            question: 'Which word is a verb?',
            options: ['cat', 'jump', 'red', 'school'],
            correctAnswer: 1,
            explanation: 'Jump is a verb (an action)'
          },
          {
            question: 'In "The bird sings," what is the noun?',
            options: ['The', 'bird', 'sings', 'None'],
            correctAnswer: 1,
            explanation: 'Bird is the noun (a thing)'
          },
          {
            question: 'In "Children play games," what is the verb?',
            options: ['Children', 'play', 'games', 'None'],
            correctAnswer: 1,
            explanation: 'Play is the verb (the action)'
          },
          {
            question: 'Which is NOT a noun?',
            options: ['book', 'swim', 'teacher', 'desk'],
            correctAnswer: 1,
            explanation: 'Swim is a verb, not a noun'
          }
        ]
      }
    }
  },
  Science: {
    'Grade 1': {
      title: 'Living and Non-Living Things',
      description: 'Learn to identify living and non-living things',
      content: `# Living and Non-Living Things

## Living Things 🌱
Living things need food, water, and air!

**Examples:**
- 🐕 Dog
- 🌳 Tree
- 🦋 Butterfly
- 👦 People
- 🐱 Cat

### What Living Things Do:
1. They grow
2. They eat
3. They breathe
4. They move

## Non-Living Things 🪨
Non-living things don't need food or water!

**Examples:**
- 🪑 Chair
- 📚 Book
- 🚗 Car
- ⚽ Ball
- 🪨 Rock

### What Non-Living Things Are:
1. They don't grow
2. They don't eat
3. They don't breathe
4. Some can move (like cars) but they don't move by themselves

Amazing discoveries! 🔬`,
      quiz: {
        title: 'Living Things Quiz',
        questions: [
          {
            question: 'Which one is a living thing?',
            options: ['Rock', 'Plant', 'Book', 'Chair'],
            correctAnswer: 1,
            explanation: 'A plant is a living thing because it grows and needs water'
          },
          {
            question: 'Which one is NOT living?',
            options: ['Dog', 'Car', 'Cat', 'Bird'],
            correctAnswer: 1,
            explanation: 'A car is not living - it cannot grow or eat'
          },
          {
            question: 'What do all living things need?',
            options: ['Toys', 'Water', 'Television', 'Computers'],
            correctAnswer: 1,
            explanation: 'All living things need water to survive'
          },
          {
            question: 'Which can grow?',
            options: ['Stone', 'Tree', 'Pencil', 'Ball'],
            correctAnswer: 1,
            explanation: 'Trees are living things that grow'
          },
          {
            question: 'Is a flower living or non-living?',
            options: ['Non-living', 'Living', 'Sometimes', 'Never'],
            correctAnswer: 1,
            explanation: 'A flower is living because it grows and needs water'
          }
        ]
      }
    }
  }
};

async function seedFullContent() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let lessonsCreated = 0;
    let quizzesCreated = 0;

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Lesson.deleteMany({});
    // await Quiz.deleteMany({});
    // console.log('🗑️  Cleared existing lessons and quizzes\n');

    for (const [subjectName, gradeContent] of Object.entries(lessonTemplates)) {
      console.log(`\n📚 Processing ${subjectName}...`);
      
      for (const [grade, lessonData] of Object.entries(gradeContent)) {
        console.log(`  📖 Grade ${grade}:`);
        
        // Check if lesson already exists
        const existingLesson = await Lesson.findOne({
          title: lessonData.title,
          subject: subjectName,
          grade: grade
        });

        let lesson;
        if (!existingLesson) {
          // Create lesson
          lesson = await Lesson.create({
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            subject: subjectName,
            grade: grade,
            term: 'First Term',
            order: 1,
            difficulty: 'beginner',
            duration: 30,
            keywords: [subjectName, `Grade ${grade}`, 'Practice'],
            learningObjectives: [
              `Master ${lessonData.title}`,
              'Practice with examples',
              'Test your knowledge'
            ]
          });
          console.log(`    ✅ Created lesson: ${lessonData.title}`);
          lessonsCreated++;
        } else {
          lesson = existingLesson;
          console.log(`    ℹ️  Lesson exists: ${lessonData.title}`);
        }

        // Check if quiz already exists
        const existingQuiz = await Quiz.findOne({ lessonId: lesson._id });

        if (!existingQuiz && lessonData.quiz) {
          // Create quiz
          await Quiz.create({
            lessonId: lesson._id,
            title: lessonData.quiz.title,
            description: `Test your knowledge of ${lessonData.title}`,
            questions: lessonData.quiz.questions,
            passingScore: 80,
            timeLimit: 600 // 10 minutes
          });
          console.log(`    ✅ Created quiz: ${lessonData.quiz.title}`);
          quizzesCreated++;
        } else if (existingQuiz) {
          console.log(`    ℹ️  Quiz exists: ${existingQuiz.title}`);
        }
      }
    }

    console.log('\n\n📊 Summary:');
    console.log(`✅ Lessons created: ${lessonsCreated}`);
    console.log(`✅ Quizzes created: ${quizzesCreated}`);
    console.log('\n✨ Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

seedFullContent();
