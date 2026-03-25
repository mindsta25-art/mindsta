import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Lesson } from '../server/models/index.js';
import Quiz from '../server/models/Quiz.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

// ─────────────────────────────────────────────
// LESSON DATA
// grade: '1' or '2' (matches BrowseCourses query values)
// ─────────────────────────────────────────────
const lessonsData = [
  // ── Grade 1 Mathematics ──────────────────────────────────────────────────
  {
    title: 'Numbers 1 to 10',
    subtitle: 'Introduction to counting and number recognition',
    description: 'Learn to recognize, count, and write numbers from 1 to 10. This foundational lesson introduces young learners to the world of mathematics through fun activities and exercises.',
    overview: 'Students will be able to identify, write, and order numbers 1 to 10 by the end of this lesson.',
    subject: 'Mathematics',
    grade: '1',
    term: 'First Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Recognize and write numbers 1 to 10',
      'Count objects up to 10',
      'Arrange numbers in order from smallest to largest',
      'Match numbers to groups of objects',
    ],
    requirements: ['No prior mathematics knowledge needed'],
    targetAudience: ['Grade 1 students', 'Early learners aged 5–7'],
    keywords: ['counting', 'numbers', 'grade 1', 'mathematics', 'first term'],
    order: 1,
  },
  {
    title: 'Basic Addition (Up to 10)',
    subtitle: 'Adding small numbers together',
    description: 'Discover the joy of addition! Students will learn to add two numbers together with totals up to 10, using objects, pictures, and number lines as learning aids.',
    overview: 'Master simple addition facts through hands-on activities and visual models.',
    subject: 'Mathematics',
    grade: '1',
    term: 'First Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand what addition means',
      'Add two numbers with sums up to 10',
      'Use a number line to add',
      'Solve simple word problems involving addition',
    ],
    requirements: ['Numbers 1 to 10'],
    targetAudience: ['Grade 1 students'],
    keywords: ['addition', 'grade 1', 'mathematics', 'first term'],
    order: 2,
  },
  {
    title: 'Basic Subtraction (Up to 10)',
    subtitle: 'Taking away and finding the difference',
    description: 'Build on addition skills to explore subtraction. Students will learn to subtract small numbers and understand the concept of "taking away" using pictures and number lines.',
    overview: 'Understand subtraction as taking away and find differences within 10.',
    subject: 'Mathematics',
    grade: '1',
    term: 'First Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand subtraction as taking away',
      'Subtract numbers within 10',
      'Use a number line to subtract',
      'Solve simple subtraction word problems',
    ],
    requirements: ['Basic Addition (Up to 10)'],
    targetAudience: ['Grade 1 students'],
    keywords: ['subtraction', 'grade 1', 'mathematics', 'first term'],
    order: 3,
  },
  {
    title: 'Numbers 11 to 20',
    subtitle: 'Extending counting beyond ten',
    description: 'Expand number knowledge from 1–10 to 1–20. Students will learn to recognize, write, and compare numbers 11 to 20 and understand the concept of "tens and ones".',
    overview: 'Recognize and use numbers up to 20 with confidence.',
    subject: 'Mathematics',
    grade: '1',
    term: 'Second Term',
    price: 1500,
    duration: 40,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Read and write numbers 11 to 20',
      'Count forward and backward between 1 and 20',
      'Compare numbers using greater than and less than',
      'Understand place value: tens and ones',
    ],
    requirements: ['Numbers 1 to 10'],
    targetAudience: ['Grade 1 students'],
    keywords: ['numbers', 'grade 1', 'mathematics', 'second term'],
    order: 4,
  },
  {
    title: 'Shapes and Patterns',
    subtitle: 'Recognizing 2D shapes and repeating patterns',
    description: 'Explore the world of shapes! Students will identify common 2D shapes—circle, square, triangle, and rectangle—and recognize and create simple repeating patterns.',
    overview: 'Identify shapes and continue or create simple patterns.',
    subject: 'Mathematics',
    grade: '1',
    term: 'Second Term',
    price: 1500,
    duration: 40,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Name and describe common 2D shapes',
      'Sort shapes by colour, size, and type',
      'Identify and extend repeating patterns',
      'Create your own simple patterns',
    ],
    requirements: ['Numbers 1 to 10'],
    targetAudience: ['Grade 1 students'],
    keywords: ['shapes', 'patterns', 'grade 1', 'mathematics', 'second term'],
    order: 5,
  },
  {
    title: 'Measurement: Length and Weight',
    subtitle: 'Comparing and measuring everyday objects',
    description: 'Learn to compare lengths and weights using everyday language such as longer, shorter, heavier, and lighter. Students will use non-standard units to measure objects.',
    overview: 'Compare and measure objects using informal units.',
    subject: 'Mathematics',
    grade: '1',
    term: 'Second Term',
    price: 1500,
    duration: 40,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Compare lengths using longer, shorter, and equal',
      'Compare weights using heavier and lighter',
      'Measure length using non-standard units',
      'Describe and order objects by size',
    ],
    requirements: ['Numbers 1 to 10'],
    targetAudience: ['Grade 1 students'],
    keywords: ['measurement', 'length', 'weight', 'grade 1', 'mathematics', 'second term'],
    order: 6,
  },

  // ── Grade 1 English ──────────────────────────────────────────────────────
  {
    title: 'The Alphabet',
    subtitle: 'Learning all 26 letters in upper and lower case',
    description: 'A complete introduction to the English alphabet. Students will learn to recognize, name, and write all 26 letters in both uppercase and lowercase forms.',
    overview: 'Know all 26 letters of the alphabet by sight and sound.',
    subject: 'English',
    grade: '1',
    term: 'First Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Recite the alphabet in order',
      'Recognize uppercase and lowercase letters',
      'Write all 26 letters correctly',
      'Identify letters at the beginning of words',
    ],
    requirements: ['No prior reading knowledge needed'],
    targetAudience: ['Grade 1 students', 'Beginner readers'],
    keywords: ['alphabet', 'letters', 'english', 'grade 1', 'first term'],
    order: 1,
  },
  {
    title: 'Phonics and Sounds',
    subtitle: 'Letter sounds and blending',
    description: 'Unlock reading through phonics! Students will learn the sounds each letter makes and begin blending consonant-vowel-consonant (CVC) words like "cat", "dog", and "sit".',
    overview: 'Use letter sounds to decode simple three-letter words.',
    subject: 'English',
    grade: '1',
    term: 'First Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Identify the sound each letter makes',
      'Blend two-letter sounds (onset and rime)',
      'Read simple CVC words',
      'Identify rhyming words',
    ],
    requirements: ['The Alphabet'],
    targetAudience: ['Grade 1 students'],
    keywords: ['phonics', 'sounds', 'blending', 'english', 'grade 1', 'first term'],
    order: 2,
  },
  {
    title: 'Simple Words and Vocabulary',
    subtitle: 'Building a sight word bank',
    description: 'Expand vocabulary with common sight words and everyday nouns. Students will read, spell, and use words for common objects, animals, colours, and actions.',
    overview: 'Read and spell a bank of 30+ common sight words and everyday vocabulary.',
    subject: 'English',
    grade: '1',
    term: 'First Term',
    price: 1500,
    duration: 40,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Read 30+ common sight words',
      'Name everyday objects, colours, and animals in English',
      'Match words to pictures',
      'Use new vocabulary in spoken sentences',
    ],
    requirements: ['Phonics and Sounds'],
    targetAudience: ['Grade 1 students'],
    keywords: ['vocabulary', 'sight words', 'english', 'grade 1', 'first term'],
    order: 3,
  },
  {
    title: 'Simple Sentences',
    subtitle: 'Constructing basic subject-verb sentences',
    description: 'Learn to build simple sentences! Students will construct sentences using a subject and a verb, practice correct word order, and use capital letters and full stops.',
    overview: 'Write and read simple sentences with correct punctuation.',
    subject: 'English',
    grade: '1',
    term: 'Second Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand what makes a complete sentence',
      'Use a capital letter at the start of a sentence',
      'End sentences with a full stop',
      'Write three simple sentences about yourself',
    ],
    requirements: ['Simple Words and Vocabulary'],
    targetAudience: ['Grade 1 students'],
    keywords: ['sentences', 'writing', 'english', 'grade 1', 'second term'],
    order: 4,
  },
  {
    title: 'Reading Comprehension: Short Stories',
    subtitle: 'Understanding what you read',
    description: 'Practice reading short, illustrated stories and answering questions about them. Students will develop the habit of reading for meaning and improve their listening and comprehension skills.',
    overview: 'Read a short story and answer who, what, and where questions about it.',
    subject: 'English',
    grade: '1',
    term: 'Second Term',
    price: 1500,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Read a short passage with understanding',
      'Answer who, what, and where questions',
      'Identify the main character and setting',
      'Retell a story in your own words',
    ],
    requirements: ['Simple Sentences'],
    targetAudience: ['Grade 1 students'],
    keywords: ['reading', 'comprehension', 'stories', 'english', 'grade 1', 'second term'],
    order: 5,
  },

  // ── Grade 2 Mathematics ──────────────────────────────────────────────────
  {
    title: 'Numbers 1 to 100',
    subtitle: 'Counting, reading, and writing up to 100',
    description: 'Extend number skills to 100. Students will count in ones, twos, fives, and tens, read and write two-digit numbers, and understand place value (tens and ones).',
    overview: 'Read, write, and order numbers up to 100 with confidence.',
    subject: 'Mathematics',
    grade: '2',
    term: 'First Term',
    price: 1800,
    duration: 50,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Count forward and backward to 100',
      'Skip-count in 2s, 5s, and 10s',
      'Read and write two-digit numbers',
      'Identify the tens digit and the ones digit',
    ],
    requirements: ['Numbers 1 to 20 (Grade 1)'],
    targetAudience: ['Grade 2 students'],
    keywords: ['numbers', 'place value', 'grade 2', 'mathematics', 'first term'],
    order: 1,
  },
  {
    title: 'Addition up to 50',
    subtitle: 'Adding two-digit numbers',
    description: 'Build on basic addition to work with larger numbers. Students will add two-digit numbers with and without regrouping using place value strategies and number lines.',
    overview: 'Add two-digit numbers accurately using place value understanding.',
    subject: 'Mathematics',
    grade: '2',
    term: 'First Term',
    price: 1800,
    duration: 50,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Add two-digit numbers without regrouping',
      'Add two-digit numbers with regrouping (carrying)',
      'Solve addition word problems',
      'Check answers using the inverse operation',
    ],
    requirements: ['Numbers 1 to 100'],
    targetAudience: ['Grade 2 students'],
    keywords: ['addition', 'grade 2', 'mathematics', 'first term'],
    order: 2,
  },
  {
    title: 'Subtraction up to 50',
    subtitle: 'Subtracting two-digit numbers',
    description: 'Master subtraction with two-digit numbers. Students will learn to subtract with and without borrowing, use number lines, and solve subtraction word problems.',
    overview: 'Subtract two-digit numbers confidently and solve related word problems.',
    subject: 'Mathematics',
    grade: '2',
    term: 'First Term',
    price: 1800,
    duration: 50,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Subtract two-digit numbers without borrowing',
      'Subtract two-digit numbers with borrowing',
      'Solve subtraction word problems',
      'Check subtraction using addition',
    ],
    requirements: ['Addition up to 50'],
    targetAudience: ['Grade 2 students'],
    keywords: ['subtraction', 'grade 2', 'mathematics', 'first term'],
    order: 3,
  },
  {
    title: 'Introduction to Multiplication',
    subtitle: 'Repeated addition and the times tables (×2, ×5, ×10)',
    description: 'Introduce multiplication as repeated addition. Students will learn the 2, 5, and 10 times tables using arrays, number lines, and real-world examples.',
    overview: 'Understand multiplication as repeated addition and recall ×2, ×5, and ×10 facts.',
    subject: 'Mathematics',
    grade: '2',
    term: 'Second Term',
    price: 1800,
    duration: 55,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand multiplication as repeated addition',
      'Use arrays to model multiplication',
      'Recall multiplication facts for 2, 5, and 10',
      'Solve simple multiplication word problems',
    ],
    requirements: ['Addition up to 50'],
    targetAudience: ['Grade 2 students'],
    keywords: ['multiplication', 'times tables', 'grade 2', 'mathematics', 'second term'],
    order: 4,
  },
  {
    title: 'Introduction to Division',
    subtitle: 'Sharing equally and grouping',
    description: 'Explore division as sharing equally and grouping. Students will relate division to multiplication and solve simple division problems using objects and pictures.',
    overview: 'Divide small quantities equally and connect division to multiplication.',
    subject: 'Mathematics',
    grade: '2',
    term: 'Second Term',
    price: 1800,
    duration: 50,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand division as equal sharing',
      'Understand division as grouping',
      'Relate division to multiplication facts for 2, 5, and 10',
      'Solve simple division word problems',
    ],
    requirements: ['Introduction to Multiplication'],
    targetAudience: ['Grade 2 students'],
    keywords: ['division', 'sharing', 'grade 2', 'mathematics', 'second term'],
    order: 5,
  },
  {
    title: 'Introduction to Fractions',
    subtitle: 'Halves, quarters, and thirds',
    description: 'Begin exploring fractions by dividing shapes and sets into equal parts. Students will understand and identify one half (½), one quarter (¼), and one third (⅓).',
    overview: 'Identify and describe simple fractions of shapes and quantities.',
    subject: 'Mathematics',
    grade: '2',
    term: 'Second Term',
    price: 1800,
    duration: 50,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand what a fraction is',
      'Identify one half, one quarter, and one third of a shape',
      'Find a fraction of a small set of objects',
      'Compare simple fractions',
    ],
    requirements: ['Introduction to Division'],
    targetAudience: ['Grade 2 students'],
    keywords: ['fractions', 'halves', 'quarters', 'grade 2', 'mathematics', 'second term'],
    order: 6,
  },

  // ── Grade 2 English ──────────────────────────────────────────────────────
  {
    title: 'Nouns and Verbs',
    subtitle: 'Identifying people, places, things, and actions',
    description: 'Explore the building blocks of language! Students will learn to identify nouns (people, places, and things) and verbs (action words) in sentences.',
    overview: 'Identify and use nouns and verbs correctly in speech and writing.',
    subject: 'English',
    grade: '2',
    term: 'First Term',
    price: 1800,
    duration: 50,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Define what a noun is and give examples',
      'Define what a verb is and give examples',
      'Identify nouns and verbs in simple sentences',
      'Use nouns and verbs to write your own sentences',
    ],
    requirements: ['Simple Sentences (Grade 1)'],
    targetAudience: ['Grade 2 students'],
    keywords: ['nouns', 'verbs', 'grammar', 'english', 'grade 2', 'first term'],
    order: 1,
  },
  {
    title: 'Adjectives: Describing Words',
    subtitle: 'Adding detail with describing words',
    description: 'Bring sentences to life with adjectives! Students will learn to identify and use adjectives to describe size, colour, shape, and feelings in their writing.',
    overview: 'Use adjectives to make sentences more descriptive and interesting.',
    subject: 'English',
    grade: '2',
    term: 'First Term',
    price: 1800,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Understand what an adjective is',
      'Identify adjectives in sentences',
      'Use adjectives of size, colour, and feeling',
      'Expand simple sentences by adding adjectives',
    ],
    requirements: ['Nouns and Verbs'],
    targetAudience: ['Grade 2 students'],
    keywords: ['adjectives', 'describing words', 'english', 'grade 2', 'first term'],
    order: 2,
  },
  {
    title: 'Punctuation: Capitals, Full Stops, and Question Marks',
    subtitle: 'Using punctuation correctly in writing',
    description: 'Master essential punctuation. Students will learn when to use capital letters, full stops, and question marks, and apply these rules in their own writing.',
    overview: 'Apply correct punctuation to statements and questions.',
    subject: 'English',
    grade: '2',
    term: 'First Term',
    price: 1800,
    duration: 45,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Use capital letters for names and sentence starts',
      'End statements with a full stop',
      'End questions with a question mark',
      'Edit a passage to add correct punctuation',
    ],
    requirements: ['Nouns and Verbs'],
    targetAudience: ['Grade 2 students'],
    keywords: ['punctuation', 'capital letters', 'full stop', 'english', 'grade 2', 'first term'],
    order: 3,
  },
  {
    title: 'Reading Stories and Comprehension',
    subtitle: 'Understanding and analysing short passages',
    description: 'Develop reading fluency and comprehension. Students will read age-appropriate stories, identify the main idea, characters, and sequence of events, and answer questions in full sentences.',
    overview: 'Read a passage fluently and answer comprehension questions in full sentences.',
    subject: 'English',
    grade: '2',
    term: 'Second Term',
    price: 1800,
    duration: 55,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Read a short passage with fluency',
      'Identify the main idea and supporting details',
      'Sequence events in the correct order',
      'Answer comprehension questions in full sentences',
    ],
    requirements: ['Simple Sentences (Grade 1)', 'Punctuation'],
    targetAudience: ['Grade 2 students'],
    keywords: ['reading', 'comprehension', 'stories', 'english', 'grade 2', 'second term'],
    order: 4,
  },
  {
    title: 'Creative Writing: My Story',
    subtitle: 'Planning and writing a short story',
    description: 'Become a storyteller! Students will plan a short story with a beginning, middle, and end using a simple story map, then write and illustrate their own story.',
    overview: 'Plan and write a short three-part story independently.',
    subject: 'English',
    grade: '2',
    term: 'Second Term',
    price: 1800,
    duration: 55,
    difficulty: 'beginner',
    whatYouWillLearn: [
      'Use a story map to plan writing',
      'Write a story with a clear beginning, middle, and end',
      'Use adjectives and time words in your story',
      'Edit and improve your own writing',
    ],
    requirements: ['Adjectives: Describing Words', 'Punctuation'],
    targetAudience: ['Grade 2 students'],
    keywords: ['creative writing', 'story', 'english', 'grade 2', 'second term'],
    order: 5,
  },
];

// ─────────────────────────────────────────────
// QUIZ DATA builders — keyed by lesson title
// ─────────────────────────────────────────────
const quizDataByLesson = {
  'Numbers 1 to 10': {
    title: 'Numbers 1 to 10 Quiz',
    description: 'Test your knowledge of numbers 1 to 10.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'How many fingers are on one hand?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 2,
        explanation: 'One hand has 5 fingers.',
      },
      {
        question: 'Which number comes after 7?',
        options: ['6', '9', '8', '10'],
        correctAnswer: 2,
        explanation: 'After 7 comes 8.',
      },
      {
        question: 'Which number is the smallest?',
        options: ['9', '1', '5', '7'],
        correctAnswer: 1,
        explanation: '1 is the smallest number in this group.',
      },
      {
        question: 'Count the stars: ★★★★. How many are there?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        explanation: 'There are 4 stars.',
      },
      {
        question: 'Which number comes before 6?',
        options: ['7', '4', '8', '5'],
        correctAnswer: 3,
        explanation: '5 comes before 6.',
      },
      {
        question: 'What is the largest number between 1 and 10?',
        options: ['8', '9', '10', '7'],
        correctAnswer: 2,
        explanation: '10 is the largest number from 1 to 10.',
      },
    ],
  },

  'Basic Addition (Up to 10)': {
    title: 'Basic Addition Quiz',
    description: 'Test your addition skills with sums up to 10.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: '3 + 4 = ?',
        options: ['6', '7', '8', '5'],
        correctAnswer: 1,
        explanation: '3 + 4 = 7.',
      },
      {
        question: '2 + 5 = ?',
        options: ['6', '8', '7', '9'],
        correctAnswer: 2,
        explanation: '2 + 5 = 7.',
      },
      {
        question: '1 + 9 = ?',
        options: ['8', '11', '10', '9'],
        correctAnswer: 2,
        explanation: '1 + 9 = 10.',
      },
      {
        question: '4 + 4 = ?',
        options: ['9', '7', '8', '6'],
        correctAnswer: 2,
        explanation: '4 + 4 = 8.',
      },
      {
        question: 'Amaka has 3 apples and gets 2 more. How many does she have?',
        options: ['4', '5', '6', '3'],
        correctAnswer: 1,
        explanation: '3 + 2 = 5 apples.',
      },
      {
        question: '0 + 6 = ?',
        options: ['0', '7', '5', '6'],
        correctAnswer: 3,
        explanation: 'Any number added to 0 stays the same. 0 + 6 = 6.',
      },
    ],
  },

  'Basic Subtraction (Up to 10)': {
    title: 'Basic Subtraction Quiz',
    description: 'Practice taking away numbers within 10.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: '8 − 3 = ?',
        options: ['4', '6', '5', '7'],
        correctAnswer: 2,
        explanation: '8 − 3 = 5.',
      },
      {
        question: '10 − 4 = ?',
        options: ['5', '7', '6', '8'],
        correctAnswer: 2,
        explanation: '10 − 4 = 6.',
      },
      {
        question: '7 − 7 = ?',
        options: ['1', '0', '2', '7'],
        correctAnswer: 1,
        explanation: 'Any number minus itself is 0.',
      },
      {
        question: 'There are 9 birds on a tree. 5 fly away. How many are left?',
        options: ['3', '5', '4', '6'],
        correctAnswer: 2,
        explanation: '9 − 5 = 4 birds remain.',
      },
      {
        question: '6 − 2 = ?',
        options: ['3', '5', '4', '2'],
        correctAnswer: 2,
        explanation: '6 − 2 = 4.',
      },
      {
        question: '5 − 0 = ?',
        options: ['0', '4', '5', '1'],
        correctAnswer: 2,
        explanation: 'Subtracting 0 from any number leaves it unchanged.',
      },
    ],
  },

  'Numbers 11 to 20': {
    title: 'Numbers 11 to 20 Quiz',
    description: 'Test your knowledge of numbers from 11 to 20.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'Which number comes after 14?',
        options: ['13', '16', '15', '17'],
        correctAnswer: 2,
        explanation: '15 comes after 14.',
      },
      {
        question: 'What is the value of the tens digit in the number 17?',
        options: ['7', '17', '1', '10'],
        correctAnswer: 2,
        explanation: 'In 17, the tens digit is 1 (worth 10).',
      },
      {
        question: 'Which number is greater: 13 or 18?',
        options: ['13', '18', 'They are equal', 'Cannot tell'],
        correctAnswer: 1,
        explanation: '18 is greater than 13.',
      },
      {
        question: 'How many ones are in the number 19?',
        options: ['1', '9', '10', '19'],
        correctAnswer: 1,
        explanation: '19 has 9 ones and 1 ten.',
      },
      {
        question: 'Count in 2s: 12, 14, __, 18. What is the missing number?',
        options: ['15', '16', '17', '13'],
        correctAnswer: 1,
        explanation: 'Counting in 2s: 12, 14, 16, 18.',
      },
      {
        question: 'What is 10 + 7?',
        options: ['16', '17', '18', '15'],
        correctAnswer: 1,
        explanation: '10 + 7 = 17.',
      },
    ],
  },

  'Shapes and Patterns': {
    title: 'Shapes and Patterns Quiz',
    description: 'Identify shapes and complete patterns.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'How many sides does a triangle have?',
        options: ['2', '4', '3', '5'],
        correctAnswer: 2,
        explanation: 'A triangle has 3 sides.',
      },
      {
        question: 'Which shape has 4 equal sides?',
        options: ['Circle', 'Rectangle', 'Triangle', 'Square'],
        correctAnswer: 3,
        explanation: 'A square has 4 equal sides.',
      },
      {
        question: 'A shape with no corners is called a …',
        options: ['Square', 'Circle', 'Triangle', 'Rectangle'],
        correctAnswer: 1,
        explanation: 'A circle has no corners or straight sides.',
      },
      {
        question: 'Look at this pattern: ○ □ ○ □ ○ __ What comes next?',
        options: ['○', '△', '□', '◇'],
        correctAnswer: 2,
        explanation: 'The pattern alternates circle and square, so a square comes next.',
      },
      {
        question: 'How many corners does a rectangle have?',
        options: ['2', '3', '4', '6'],
        correctAnswer: 2,
        explanation: 'A rectangle has 4 corners.',
      },
      {
        question: 'Which of these is NOT a 2D shape?',
        options: ['Triangle', 'Circle', 'Cube', 'Square'],
        correctAnswer: 2,
        explanation: 'A cube is a 3D shape, not a 2D shape.',
      },
    ],
  },

  'Measurement: Length and Weight': {
    title: 'Measurement Quiz',
    description: 'Test your understanding of length and weight comparisons.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'A pencil is ___ than a ruler.',
        options: ['longer', 'shorter', 'heavier', 'wider'],
        correctAnswer: 1,
        explanation: 'A pencil is usually shorter than a ruler.',
      },
      {
        question: 'A bag of rice is ___ than a feather.',
        options: ['lighter', 'shorter', 'heavier', 'longer'],
        correctAnswer: 2,
        explanation: 'A bag of rice is much heavier than a feather.',
      },
      {
        question: 'Which tool do we use to measure how heavy something is?',
        options: ['Ruler', 'Clock', 'Scale/Balance', 'Thermometer'],
        correctAnswer: 2,
        explanation: 'A scale or balance is used to measure weight.',
      },
      {
        question: 'Kemi measured the table with her hands and counted 8 hand-lengths. What unit did she use?',
        options: ['Centimetres', 'Kilograms', 'Non-standard (hand)', 'Metres'],
        correctAnswer: 2,
        explanation: 'Measuring with hands is a non-standard unit of measurement.',
      },
      {
        question: 'If a rope is 5 sticks long and another is 3 sticks long, which is longer?',
        options: ['3-stick rope', '5-stick rope', 'They are equal', 'Cannot tell'],
        correctAnswer: 1,
        explanation: 'The 5-stick rope is longer.',
      },
    ],
  },

  'The Alphabet': {
    title: 'The Alphabet Quiz',
    description: 'Show what you know about the English alphabet.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'How many letters are in the English alphabet?',
        options: ['24', '25', '26', '27'],
        correctAnswer: 2,
        explanation: 'The English alphabet has 26 letters.',
      },
      {
        question: 'Which letter comes after M in the alphabet?',
        options: ['L', 'N', 'O', 'K'],
        correctAnswer: 1,
        explanation: 'N comes after M in the alphabet.',
      },
      {
        question: 'What is the last letter of the alphabet?',
        options: ['X', 'Y', 'Z', 'W'],
        correctAnswer: 2,
        explanation: 'Z is the last letter of the alphabet.',
      },
      {
        question: 'Which of these is a lowercase letter?',
        options: ['A', 'B', 'c', 'D'],
        correctAnswer: 2,
        explanation: '"c" is the lowercase form of the letter C.',
      },
      {
        question: 'Which letter comes before F?',
        options: ['G', 'D', 'E', 'H'],
        correctAnswer: 2,
        explanation: 'E comes before F in the alphabet.',
      },
      {
        question: 'Which of these groups is in correct alphabetical order?',
        options: ['D, B, C', 'A, C, B', 'A, B, C', 'C, A, B'],
        correctAnswer: 2,
        explanation: 'A, B, C is the correct alphabetical order.',
      },
    ],
  },

  'Phonics and Sounds': {
    title: 'Phonics and Sounds Quiz',
    description: 'Test your knowledge of letter sounds and simple words.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'What sound does the letter "b" make?',
        options: ['/d/', '/p/', '/b/', '/g/'],
        correctAnswer: 2,
        explanation: 'The letter "b" makes the /b/ sound, as in "ball".',
      },
      {
        question: 'Which word rhymes with "cat"?',
        options: ['cup', 'bat', 'dog', 'kite'],
        correctAnswer: 1,
        explanation: '"bat" rhymes with "cat" — they both end in "-at".',
      },
      {
        question: 'What is the first sound in the word "sun"?',
        options: ['/n/', '/u/', '/s/', '/m/'],
        correctAnswer: 2,
        explanation: '"sun" starts with the /s/ sound.',
      },
      {
        question: 'Blend these sounds: /d/ /o/ /g/. What word do you get?',
        options: ['bog', 'log', 'dog', 'fog'],
        correctAnswer: 2,
        explanation: 'Blending /d/ /o/ /g/ gives the word "dog".',
      },
      {
        question: 'Which word starts with the same sound as "fish"?',
        options: ['van', 'fan', 'pan', 'ban'],
        correctAnswer: 1,
        explanation: '"fan" starts with the /f/ sound, the same as "fish".',
      },
      {
        question: 'How many sounds are in the word "sit"?',
        options: ['1', '2', '3', '4'],
        correctAnswer: 2,
        explanation: '"sit" has 3 sounds: /s/ /i/ /t/.',
      },
    ],
  },

  'Simple Words and Vocabulary': {
    title: 'Vocabulary Quiz',
    description: 'Test your sight word and everyday vocabulary knowledge.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'Which of these is an animal?',
        options: ['table', 'chair', 'dog', 'book'],
        correctAnswer: 2,
        explanation: 'A dog is an animal.',
      },
      {
        question: 'What colour is the sky on a sunny day?',
        options: ['red', 'green', 'blue', 'yellow'],
        correctAnswer: 2,
        explanation: 'The sky is blue on a sunny day.',
      },
      {
        question: 'Which word means the opposite of "big"?',
        options: ['tall', 'small', 'fast', 'hot'],
        correctAnswer: 1,
        explanation: '"small" is the opposite of "big".',
      },
      {
        question: 'Choose the correct word: "I ___ to school every day."',
        options: ['goes', 'going', 'go', 'gone'],
        correctAnswer: 2,
        explanation: '"go" is the correct verb form for "I".',
      },
      {
        question: 'Which word names a fruit?',
        options: ['spoon', 'mango', 'shoe', 'pencil'],
        correctAnswer: 1,
        explanation: 'Mango is a fruit.',
      },
      {
        question: 'What do you call the place where you sleep?',
        options: ['kitchen', 'toilet', 'bedroom', 'garden'],
        correctAnswer: 2,
        explanation: 'A bedroom is the place where you sleep.',
      },
    ],
  },

  'Simple Sentences': {
    title: 'Simple Sentences Quiz',
    description: 'Check your understanding of sentence structure and punctuation.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'Which of these is a complete sentence?',
        options: ['The big.', 'Runs fast.', 'The cat runs fast.', 'Cat the fast.'],
        correctAnswer: 2,
        explanation: '"The cat runs fast." has a subject (cat) and a verb (runs).',
      },
      {
        question: 'A sentence must always begin with a …',
        options: ['full stop', 'capital letter', 'comma', 'question mark'],
        correctAnswer: 1,
        explanation: 'Every sentence begins with a capital letter.',
      },
      {
        question: 'A statement ends with a …',
        options: ['question mark', 'comma', 'full stop', 'exclamation mark'],
        correctAnswer: 2,
        explanation: 'A statement (telling sentence) ends with a full stop.',
      },
      {
        question: 'Which sentence is written correctly?',
        options: ['i like rice.', 'I like rice.', 'i Like Rice.', 'I Like Rice'],
        correctAnswer: 1,
        explanation: 'The sentence starts with a capital "I" and ends with a full stop.',
      },
      {
        question: 'Rearrange the words to make a sentence: "plays / Tunde / football"',
        options: ['football Tunde plays', 'Tunde plays football.', 'plays football Tunde', 'football plays Tunde'],
        correctAnswer: 1,
        explanation: 'The correct order is: Tunde plays football.',
      },
      {
        question: 'Which word is the subject (the "doer") in this sentence? "The dog barked loudly."',
        options: ['barked', 'loudly', 'the', 'dog'],
        correctAnswer: 3,
        explanation: '"dog" is the subject — it is doing the barking.',
      },
    ],
  },

  'Reading Comprehension: Short Stories': {
    title: 'Reading Comprehension Quiz',
    description: 'Answer questions about a short passage.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: 'What does comprehension mean?',
        options: ['Reading fast', 'Writing neatly', 'Understanding what you read', 'Counting words'],
        correctAnswer: 2,
        explanation: 'Comprehension means understanding the meaning of what you have read.',
      },
      {
        question: 'A "character" in a story is …',
        options: ['the place where the story happens', 'a person or animal in the story', 'the lesson the story teaches', 'the title of the story'],
        correctAnswer: 1,
        explanation: 'A character is a person or animal that takes part in the story.',
      },
      {
        question: 'Where a story takes place is called the …',
        options: ['character', 'theme', 'setting', 'plot'],
        correctAnswer: 2,
        explanation: 'The setting is the place (and time) where a story happens.',
      },
      {
        question: 'Which question word asks about a person?',
        options: ['Where', 'What', 'Who', 'When'],
        correctAnswer: 2,
        explanation: '"Who" asks about a person or character.',
      },
      {
        question: '"Retell" a story means to …',
        options: ['Read it again silently', 'Write it down word for word', 'Tell it in your own words', 'Draw pictures of it'],
        correctAnswer: 2,
        explanation: 'Retelling means explaining the story using your own words.',
      },
      {
        question: 'What is the MAIN IDEA of a passage?',
        options: ['A small detail from the passage', 'The most important point of the passage', 'The last sentence only', 'The title of the book'],
        correctAnswer: 1,
        explanation: 'The main idea is the central or most important message of the passage.',
      },
    ],
  },

  // Grade 2 Mathematics Quizzes
  'Numbers 1 to 100': {
    title: 'Numbers 1 to 100 Quiz',
    description: 'Show your knowledge of numbers up to 100.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: 'What is the value of the tens digit in 63?',
        options: ['3', '6', '60', '63'],
        correctAnswer: 1,
        explanation: 'In 63, the tens digit is 6 (worth 60).',
      },
      {
        question: 'Count in 10s: 10, 20, 30, __, 50. What is the missing number?',
        options: ['35', '40', '45', '42'],
        correctAnswer: 1,
        explanation: 'Counting in 10s: 10, 20, 30, 40, 50.',
      },
      {
        question: 'Which number is greater: 47 or 74?',
        options: ['47', '74', 'They are equal', 'Cannot tell'],
        correctAnswer: 1,
        explanation: '74 is greater than 47.',
      },
      {
        question: 'What comes just before 100?',
        options: ['98', '101', '99', '90'],
        correctAnswer: 2,
        explanation: '99 comes just before 100.',
      },
      {
        question: 'Count in 5s: 5, 10, __, 20, 25. What is missing?',
        options: ['12', '14', '15', '16'],
        correctAnswer: 2,
        explanation: 'Counting in 5s: 5, 10, 15, 20, 25.',
      },
      {
        question: 'How many tens are in the number 80?',
        options: ['8', '0', '80', '18'],
        correctAnswer: 0,
        explanation: '80 has 8 tens.',
      },
    ],
  },

  'Addition up to 50': {
    title: 'Addition up to 50 Quiz',
    description: 'Test your two-digit addition skills.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: '23 + 14 = ?',
        options: ['36', '37', '38', '35'],
        correctAnswer: 1,
        explanation: '23 + 14 = 37.',
      },
      {
        question: '18 + 25 = ?',
        options: ['42', '44', '43', '41'],
        correctAnswer: 2,
        explanation: '18 + 25 = 43.',
      },
      {
        question: '30 + 20 = ?',
        options: ['10', '50', '60', '40'],
        correctAnswer: 1,
        explanation: '30 + 20 = 50.',
      },
      {
        question: 'A trader sold 16 mangoes in the morning and 27 in the afternoon. How many did she sell altogether?',
        options: ['42', '44', '43', '45'],
        correctAnswer: 2,
        explanation: '16 + 27 = 43 mangoes.',
      },
      {
        question: '15 + 15 = ?',
        options: ['25', '30', '35', '20'],
        correctAnswer: 1,
        explanation: '15 + 15 = 30.',
      },
      {
        question: 'Which addition gives the largest answer: 24+13, 12+30, or 20+22?',
        options: ['24 + 13 = 37', '12 + 30 = 42', '20 + 22 = 42', '12 + 30 and 20 + 22 are equal (42)'],
        correctAnswer: 3,
        explanation: 'Both 12+30 and 20+22 equal 42, which is the largest.',
      },
    ],
  },

  'Subtraction up to 50': {
    title: 'Subtraction up to 50 Quiz',
    description: 'Practice subtracting two-digit numbers.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: '48 − 15 = ?',
        options: ['32', '34', '33', '35'],
        correctAnswer: 2,
        explanation: '48 − 15 = 33.',
      },
      {
        question: '50 − 27 = ?',
        options: ['22', '24', '23', '21'],
        correctAnswer: 2,
        explanation: '50 − 27 = 23.',
      },
      {
        question: 'A bag had 40 sweets. Chidi ate 18. How many are left?',
        options: ['21', '23', '22', '20'],
        correctAnswer: 2,
        explanation: '40 − 18 = 22 sweets.',
      },
      {
        question: '35 − 35 = ?',
        options: ['1', '70', '0', '35'],
        correctAnswer: 2,
        explanation: 'Any number minus itself equals 0.',
      },
      {
        question: '47 − 20 = ?',
        options: ['28', '26', '27', '25'],
        correctAnswer: 2,
        explanation: '47 − 20 = 27.',
      },
      {
        question: 'If you have 50 naira and spend 33 naira, how much do you have left?',
        options: ['16', '18', '17', '15'],
        correctAnswer: 2,
        explanation: '50 − 33 = 17 naira.',
      },
    ],
  },

  'Introduction to Multiplication': {
    title: 'Multiplication Introduction Quiz',
    description: 'Test your understanding of repeated addition and basic times tables.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: '3 × 2 means …',
        options: ['3 − 2', '3 + 2', '2 + 2 + 2', '3 + 3 + 3 + 3'],
        correctAnswer: 2,
        explanation: '3 × 2 means 3 groups of 2, which is 2 + 2 + 2 = 6.',
      },
      {
        question: '5 × 2 = ?',
        options: ['7', '9', '10', '8'],
        correctAnswer: 2,
        explanation: '5 × 2 = 10.',
      },
      {
        question: '4 × 5 = ?',
        options: ['15', '25', '20', '10'],
        correctAnswer: 2,
        explanation: '4 × 5 = 20.',
      },
      {
        question: '6 × 10 = ?',
        options: ['16', '60', '600', '6'],
        correctAnswer: 1,
        explanation: '6 × 10 = 60.',
      },
      {
        question: 'There are 3 bags with 5 oranges in each. How many oranges are there altogether?',
        options: ['8', '10', '15', '20'],
        correctAnswer: 2,
        explanation: '3 × 5 = 15 oranges.',
      },
      {
        question: '7 × 2 = ?',
        options: ['12', '14', '16', '9'],
        correctAnswer: 1,
        explanation: '7 × 2 = 14.',
      },
      {
        question: 'What is 10 × 10?',
        options: ['20', '1000', '100', '110'],
        correctAnswer: 2,
        explanation: '10 × 10 = 100.',
      },
    ],
  },

  'Introduction to Division': {
    title: 'Division Introduction Quiz',
    description: 'Test your understanding of sharing and grouping.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: '10 ÷ 2 = ?',
        options: ['4', '6', '5', '8'],
        correctAnswer: 2,
        explanation: '10 ÷ 2 = 5.',
      },
      {
        question: 'Sharing 12 sweets equally among 3 children gives each child …',
        options: ['3', '4', '6', '2'],
        correctAnswer: 1,
        explanation: '12 ÷ 3 = 4 sweets each.',
      },
      {
        question: '20 ÷ 10 = ?',
        options: ['10', '2', '5', '4'],
        correctAnswer: 1,
        explanation: '20 ÷ 10 = 2.',
      },
      {
        question: 'Division is the opposite (inverse) of …',
        options: ['Addition', 'Subtraction', 'Multiplication', 'Counting'],
        correctAnswer: 2,
        explanation: 'Division and multiplication are inverse operations.',
      },
      {
        question: '15 ÷ 5 = ?',
        options: ['2', '4', '3', '5'],
        correctAnswer: 2,
        explanation: '15 ÷ 5 = 3.',
      },
      {
        question: 'If 4 × 5 = 20, what is 20 ÷ 4?',
        options: ['4', '5', '20', '6'],
        correctAnswer: 1,
        explanation: 'Since 4 × 5 = 20, we know 20 ÷ 4 = 5.',
      },
    ],
  },

  'Introduction to Fractions': {
    title: 'Fractions Introduction Quiz',
    description: 'Test your understanding of halves, quarters, and thirds.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: 'What does ½ mean?',
        options: ['1 out of 3 equal parts', '2 out of 2 equal parts', '1 out of 2 equal parts', '1 out of 4 equal parts'],
        correctAnswer: 2,
        explanation: '½ means one out of two equal parts (one half).',
      },
      {
        question: 'A pizza is cut into 4 equal pieces. Zara eats 1 piece. What fraction did she eat?',
        options: ['½', '¼', '⅓', '¾'],
        correctAnswer: 1,
        explanation: 'Zara ate 1 out of 4 equal pieces = ¼.',
      },
      {
        question: 'Which fraction is the largest?',
        options: ['⅓', '¼', '½', 'All are equal'],
        correctAnswer: 2,
        explanation: '½ is the largest because when you split something into fewer parts, each part is bigger.',
      },
      {
        question: 'Half of 8 is …',
        options: ['2', '8', '4', '3'],
        correctAnswer: 2,
        explanation: 'Half of 8 = 8 ÷ 2 = 4.',
      },
      {
        question: 'A chocolate bar has 6 pieces. You eat ⅓ of it. How many pieces did you eat?',
        options: ['1', '3', '2', '6'],
        correctAnswer: 2,
        explanation: 'One third of 6 = 6 ÷ 3 = 2 pieces.',
      },
      {
        question: 'A shape is divided into 4 equal parts. 3 parts are shaded. What fraction is shaded?',
        options: ['¼', '½', '¾', '⅓'],
        correctAnswer: 2,
        explanation: '3 out of 4 equal parts = ¾ (three quarters).',
      },
    ],
  },

  // Grade 2 English Quizzes
  'Nouns and Verbs': {
    title: 'Nouns and Verbs Quiz',
    description: 'Identify nouns and verbs in sentences.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: 'Which of these is a noun?',
        options: ['run', 'happy', 'book', 'quickly'],
        correctAnswer: 2,
        explanation: '"book" is a noun — it is a thing.',
      },
      {
        question: 'Which of these is a verb?',
        options: ['market', 'elephant', 'jump', 'flower'],
        correctAnswer: 2,
        explanation: '"jump" is a verb — it is an action word.',
      },
      {
        question: 'Identify the noun in: "The girl sings beautifully."',
        options: ['sings', 'beautifully', 'the', 'girl'],
        correctAnswer: 3,
        explanation: '"girl" is the noun (person) in this sentence.',
      },
      {
        question: 'Identify the verb in: "The dog barks at night."',
        options: ['dog', 'night', 'barks', 'the'],
        correctAnswer: 2,
        explanation: '"barks" is the verb (action) in this sentence.',
      },
      {
        question: 'Which sentence has a proper noun?',
        options: ['The cat is sleeping.', 'Ade kicked the ball.', 'A bird flew away.', 'The book is red.'],
        correctAnswer: 1,
        explanation: '"Ade" is a proper noun — it is a specific person\'s name.',
      },
      {
        question: 'How many nouns are in this sentence? "A monkey ate a banana in the forest."',
        options: ['1', '2', '3', '4'],
        correctAnswer: 2,
        explanation: 'There are 3 nouns: monkey, banana, forest.',
      },
    ],
  },

  'Adjectives: Describing Words': {
    title: 'Adjectives Quiz',
    description: 'Test your ability to identify and use describing words.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'Which word is an adjective in: "The tall boy won the race."',
        options: ['boy', 'won', 'tall', 'race'],
        correctAnswer: 2,
        explanation: '"tall" describes the boy, so it is an adjective.',
      },
      {
        question: 'Choose the best adjective: "The __ elephant lifted the log."',
        options: ['ran', 'strong', 'slowly', 'under'],
        correctAnswer: 1,
        explanation: '"strong" is an adjective that describes the elephant.',
      },
      {
        question: 'Which of these is an adjective of colour?',
        options: ['quickly', 'purple', 'jump', 'table'],
        correctAnswer: 1,
        explanation: '"purple" is an adjective describing colour.',
      },
      {
        question: 'Add an adjective: "She wore a __ dress to the party."',
        options: ['danced', 'very', 'beautiful', 'and'],
        correctAnswer: 2,
        explanation: '"beautiful" is an adjective that describes the dress.',
      },
      {
        question: 'An adjective describes a …',
        options: ['verb', 'noun', 'sentence', 'paragraph'],
        correctAnswer: 1,
        explanation: 'Adjectives describe or modify nouns.',
      },
      {
        question: 'How many adjectives are in: "The small, red car drove fast."',
        options: ['0', '1', '2', '3'],
        correctAnswer: 2,
        explanation: '"small" and "red" are the two adjectives in the sentence.',
      },
    ],
  },

  'Punctuation: Capitals, Full Stops, and Question Marks': {
    title: 'Punctuation Quiz',
    description: 'Test your knowledge of capital letters, full stops, and question marks.',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        question: 'Which sentence uses correct punctuation?',
        options: ['where do you live.', 'Where do you live?', 'where do you live?', 'Where do you live.'],
        correctAnswer: 1,
        explanation: 'A question begins with a capital letter and ends with a question mark.',
      },
      {
        question: 'A proper noun (like a person\'s name) always starts with a …',
        options: ['lowercase letter', 'full stop', 'capital letter', 'comma'],
        correctAnswer: 2,
        explanation: 'Proper nouns always begin with a capital letter.',
      },
      {
        question: 'Which sentence ends correctly?',
        options: ['I love to read?', 'I love to read', 'I love to read.', 'i love to read.'],
        correctAnswer: 2,
        explanation: 'A statement ends with a full stop and starts with a capital letter.',
      },
      {
        question: 'Add the correct end punctuation: "What is your name__"',
        options: ['.', '!', '?', ','],
        correctAnswer: 2,
        explanation: 'This is a question, so it ends with a question mark (?).',
      },
      {
        question: 'Which word should begin with a capital letter?',
        options: ['The city of "lagos"', '"monday" is the first day', '"he" is my friend', 'She "runs" fast'],
        correctAnswer: 1,
        explanation: '"Monday" is a proper noun (name of a day) and must start with a capital letter.',
      },
      {
        question: 'How many punctuation errors are in: "my name is fatima i live in abuja."',
        options: ['1', '2', '3', '4'],
        correctAnswer: 2,
        explanation: '"my" should be "My" (capital), "fatima" → "Fatima", "abuja" → "Abuja". That is 3 errors.',
      },
    ],
  },

  'Reading Stories and Comprehension': {
    title: 'Reading and Comprehension Quiz',
    description: 'Answer questions about reading passages and comprehension skills.',
    passingScore: 70,
    timeLimit: 15,
    questions: [
      {
        question: 'What is the "main idea" of a passage?',
        options: ['A small detail in the passage', 'The most important point the passage is about', 'The last sentence of the passage', 'The title only'],
        correctAnswer: 1,
        explanation: 'The main idea is the central, most important point of the passage.',
      },
      {
        question: '"Sequence" in reading means …',
        options: ['The characters in the story', 'The lesson the story teaches', 'The order in which events happen', 'The place where the story happens'],
        correctAnswer: 2,
        explanation: 'Sequence refers to the order in which events occur in a story.',
      },
      {
        question: 'Which question asks about the ORDER of events?',
        options: ['Who is the main character?', 'What happened first?', 'Where did the story happen?', 'Why was she sad?'],
        correctAnswer: 1,
        explanation: '"What happened first?" is a sequence question about the order of events.',
      },
      {
        question: '"Supporting details" in a passage …',
        options: ['Are not important', 'Give more information about the main idea', 'Are always in the first sentence', 'Are questions at the end'],
        correctAnswer: 1,
        explanation: 'Supporting details give extra information that explains or proves the main idea.',
      },
      {
        question: 'Reading "fluently" means …',
        options: ['Reading very slowly', 'Reading smoothly at a good pace with understanding', 'Reading only the pictures', 'Skipping every other word'],
        correctAnswer: 1,
        explanation: 'Fluent reading means reading smoothly, at a good pace, and with understanding.',
      },
      {
        question: 'You can tell a story is a "fiction" story because …',
        options: ['It is about real facts', 'It is made up / imaginary', 'It has no characters', 'It is very short'],
        correctAnswer: 1,
        explanation: 'Fiction stories are made up or imaginary, as opposed to non-fiction which is based on real facts.',
      },
    ],
  },

  'Creative Writing: My Story': {
    title: 'Creative Writing Quiz',
    description: 'Test your knowledge of story structure and writing skills.',
    passingScore: 70,
    timeLimit: 12,
    questions: [
      {
        question: 'Every story has three parts. Which option lists them correctly?',
        options: ['Title, body, conclusion', 'Beginning, middle, end', 'Introduction, characters, setting', 'Nouns, verbs, adjectives'],
        correctAnswer: 1,
        explanation: 'A story has a beginning, middle, and end.',
      },
      {
        question: 'A "story map" helps writers …',
        options: ['Draw pictures', 'Find the characters', 'Plan their story before writing', 'Check their spelling'],
        correctAnswer: 2,
        explanation: 'A story map is a planning tool that helps writers organize their ideas before writing.',
      },
      {
        question: 'Which of these is a "time word" (a word that shows order)?',
        options: ['beautiful', 'Next', 'dog', 'jump'],
        correctAnswer: 1,
        explanation: '"Next" is a time word that shows the order of events.',
      },
      {
        question: 'What should you do AFTER writing your first draft?',
        options: ['Submit immediately', 'Delete it', 'Read it back and improve it', 'Ask someone else to write it'],
        correctAnswer: 2,
        explanation: 'After writing a first draft, you should read it and edit it to make it better.',
      },
      {
        question: 'In the sentence "The brave lion roared loudly", which word is an adjective?',
        options: ['lion', 'roared', 'brave', 'loudly'],
        correctAnswer: 2,
        explanation: '"brave" describes the lion, making it an adjective.',
      },
      {
        question: 'A good story ending should …',
        options: ['Introduce a new character', 'Leave the reader confused', 'Wrap up the events of the story', 'Be longer than the beginning'],
        correctAnswer: 2,
        explanation: 'A good ending brings the story to a satisfying close by wrapping up the events.',
      },
    ],
  },
};

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  let lessonsCreated = 0;
  let lessonsSkipped = 0;
  let quizzesCreated = 0;
  let quizzesSkipped = 0;

  for (const data of lessonsData) {
    const existing = await Lesson.findOne({ title: data.title, grade: data.grade, subject: data.subject });
    if (existing) {
      console.log(`  SKIP lesson: "${data.title}" (${data.subject} Grade ${data.grade})`);
      lessonsSkipped++;

      // Still try to create quiz for the existing lesson if it doesn't have one
      const existingQuiz = await Quiz.findOne({ lessonId: existing._id });
      if (!existingQuiz) {
        const qData = quizDataByLesson[data.title];
        if (qData) {
          await Quiz.create({
            ...qData,
            lessonId: existing._id,
            subject: data.subject,
            grade: data.grade,
            term: data.term,
          });
          console.log(`    + Created quiz for existing lesson: "${qData.title}"`);
          quizzesCreated++;
        }
      } else {
        quizzesSkipped++;
      }
      continue;
    }

    const lesson = await Lesson.create(data);
    console.log(`  + Lesson: "${lesson.title}" (${lesson.subject} Grade ${lesson.grade} — ${lesson.term})`);
    lessonsCreated++;

    const qData = quizDataByLesson[data.title];
    if (qData) {
      await Quiz.create({
        ...qData,
        lessonId: lesson._id,
        subject: data.subject,
        grade: data.grade,
        term: data.term,
      });
      console.log(`    + Quiz:  "${qData.title}" (${qData.questions.length} questions)`);
      quizzesCreated++;
    } else {
      console.warn(`    ! No quiz data found for "${data.title}"`);
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`Lessons created : ${lessonsCreated}`);
  console.log(`Lessons skipped : ${lessonsSkipped}`);
  console.log(`Quizzes created : ${quizzesCreated}`);
  console.log(`Quizzes skipped : ${quizzesSkipped}`);
  console.log('──────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('Done. Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
