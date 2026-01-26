/**
 * Script to create comprehensive topics for Grade 1 and Grade 2
 * Covers all major subjects with detailed learning outcomes
 * 
 * Usage: node backend/scripts/create-grade1-2-topics.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from '../server/models/Topic.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

// Comprehensive topics for Grade 1 and Grade 2
const topics = [
  // ==================== MATHEMATICS TOPICS ====================
  
  // Grade 1 Mathematics - First Term
  {
    title: 'Numbers 1-10',
    description: 'Introduction to counting and recognizing numbers from 1 to 10. Learn to count objects, write numbers, and understand number sequences.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Count from 1 to 10 correctly',
      'Recognize and write numbers 1-10',
      'Identify which number comes before or after',
      'Compare quantities using more and less'
    ],
    keywords: ['counting', 'numbers', 'mathematics', 'grade 1', 'basic math'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Basic Addition (0-10)',
    description: 'Learn simple addition with numbers up to 10. Use objects and pictures to understand addition concepts.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Understand the concept of addition',
      'Add single-digit numbers',
      'Use objects to solve addition problems',
      'Write simple addition equations'
    ],
    keywords: ['addition', 'basic math', 'mathematics', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Basic Subtraction (0-10)',
    description: 'Introduction to subtraction using numbers up to 10. Learn to take away and find differences.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Understand the concept of subtraction',
      'Subtract single-digit numbers',
      'Use objects to solve subtraction problems',
      'Write simple subtraction equations'
    ],
    keywords: ['subtraction', 'basic math', 'mathematics', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Mathematics - Second Term
  {
    title: 'Shapes and Patterns',
    description: 'Explore basic 2D shapes including circles, squares, triangles, and rectangles. Learn to recognize and create patterns.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1500,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify basic 2D shapes',
      'Count sides and corners of shapes',
      'Create and continue simple patterns',
      'Recognize shapes in everyday objects'
    ],
    keywords: ['shapes', 'geometry', 'patterns', 'mathematics', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Numbers 11-20',
    description: 'Extend counting skills to numbers 11-20. Learn number formation and simple operations.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1500,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Count from 11 to 20 correctly',
      'Recognize and write numbers 11-20',
      'Understand place value (tens and ones)',
      'Compare numbers using greater than and less than'
    ],
    keywords: ['counting', 'numbers', 'place value', 'mathematics', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Mathematics - Third Term
  {
    title: 'Measurement and Time',
    description: 'Introduction to basic measurement concepts and telling time. Learn about length, weight, and reading clocks.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'Third Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Compare objects by length and weight',
      'Use simple measuring tools',
      'Tell time to the hour',
      'Understand concepts of morning, afternoon, and evening'
    ],
    keywords: ['measurement', 'time', 'mathematics', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Money Recognition',
    description: 'Learn to identify and count coins and notes. Understand basic money concepts.',
    subject: 'Mathematics',
    grade: 'Grade 1',
    term: 'Third Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify different coins and notes',
      'Count simple amounts of money',
      'Understand the value of money',
      'Make simple purchases'
    ],
    keywords: ['money', 'counting', 'mathematics', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Mathematics - First Term
  {
    title: 'Numbers up to 100',
    description: 'Master counting, reading, and writing numbers up to 100. Understand place value in detail.',
    subject: 'Mathematics',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 220,
    learningOutcomes: [
      'Count forwards and backwards to 100',
      'Read and write numbers up to 100',
      'Understand tens and ones place value',
      'Compare and order numbers up to 100'
    ],
    keywords: ['counting', 'numbers', 'place value', 'mathematics', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Addition with Regrouping',
    description: 'Learn to add two-digit numbers with carrying. Build on basic addition skills.',
    subject: 'Mathematics',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 240,
    learningOutcomes: [
      'Add two-digit numbers',
      'Understand regrouping (carrying)',
      'Solve word problems involving addition',
      'Check addition using different methods'
    ],
    keywords: ['addition', 'regrouping', 'mathematics', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Subtraction with Regrouping',
    description: 'Master subtraction of two-digit numbers with borrowing. Develop problem-solving skills.',
    subject: 'Mathematics',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 240,
    learningOutcomes: [
      'Subtract two-digit numbers',
      'Understand regrouping (borrowing)',
      'Solve word problems involving subtraction',
      'Relate addition and subtraction'
    ],
    keywords: ['subtraction', 'regrouping', 'mathematics', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Mathematics - Second Term
  {
    title: 'Introduction to Multiplication',
    description: 'Learn the basics of multiplication as repeated addition. Master multiplication tables 2-5.',
    subject: 'Mathematics',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1800,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 250,
    learningOutcomes: [
      'Understand multiplication as repeated addition',
      'Learn multiplication tables 2, 3, 4, 5',
      'Solve simple multiplication problems',
      'Use arrays to represent multiplication'
    ],
    keywords: ['multiplication', 'times tables', 'mathematics', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Fractions - Halves and Quarters',
    description: 'Introduction to basic fractions. Learn about halves, quarters, and equal parts.',
    subject: 'Mathematics',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1800,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Understand the concept of fractions',
      'Identify halves and quarters',
      'Divide shapes into equal parts',
      'Compare simple fractions'
    ],
    keywords: ['fractions', 'halves', 'quarters', 'mathematics', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Mathematics - Third Term
  {
    title: 'Data Handling and Graphs',
    description: 'Learn to collect, organize, and represent data using simple graphs and charts.',
    subject: 'Mathematics',
    grade: 'Grade 2',
    term: 'Third Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Collect and organize data',
      'Create simple bar graphs and pictographs',
      'Read and interpret graphs',
      'Answer questions based on data'
    ],
    keywords: ['data', 'graphs', 'statistics', 'mathematics', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // ==================== ENGLISH LANGUAGE TOPICS ====================
  
  // Grade 1 English - First Term
  {
    title: 'The Alphabet and Phonics',
    description: 'Learn all 26 letters of the alphabet, their sounds, and how to form them correctly.',
    subject: 'English Language',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Recognize all 26 letters (uppercase and lowercase)',
      'Know the sound each letter makes',
      'Write letters correctly',
      'Identify beginning sounds in words'
    ],
    keywords: ['alphabet', 'phonics', 'letters', 'english', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Simple Words and Reading',
    description: 'Build vocabulary and learn to read simple three-letter words (CVC words).',
    subject: 'English Language',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 220,
    learningOutcomes: [
      'Read simple CVC words (cat, dog, sun)',
      'Blend sounds to form words',
      'Build basic sight word vocabulary',
      'Read simple sentences'
    ],
    keywords: ['reading', 'words', 'vocabulary', 'english', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 English - Second Term
  {
    title: 'Writing Simple Sentences',
    description: 'Learn to write complete sentences with proper capitalization and punctuation.',
    subject: 'English Language',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1500,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Write complete sentences',
      'Use capital letters at the beginning',
      'Use full stops at the end',
      'Leave spaces between words'
    ],
    keywords: ['writing', 'sentences', 'punctuation', 'english', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Story Time and Comprehension',
    description: 'Listen to stories, answer questions, and develop comprehension skills.',
    subject: 'English Language',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1500,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Listen to stories attentively',
      'Answer questions about stories',
      'Identify main characters and events',
      'Retell stories in own words'
    ],
    keywords: ['reading', 'stories', 'comprehension', 'english', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 English - Third Term
  {
    title: 'Nouns and Naming Words',
    description: 'Learn about nouns - words that name people, places, animals, and things.',
    subject: 'English Language',
    grade: 'Grade 1',
    term: 'Third Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify nouns in sentences',
      'Understand common and proper nouns',
      'Use nouns correctly in writing',
      'Build noun vocabulary'
    ],
    keywords: ['nouns', 'grammar', 'parts of speech', 'english', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 English - First Term
  {
    title: 'Advanced Reading Skills',
    description: 'Develop fluent reading with longer words and more complex sentences.',
    subject: 'English Language',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 240,
    learningOutcomes: [
      'Read multi-syllable words',
      'Use context clues for unknown words',
      'Read with proper expression',
      'Increase reading fluency and speed'
    ],
    keywords: ['reading', 'fluency', 'comprehension', 'english', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Verbs and Action Words',
    description: 'Learn about verbs - words that show action or state of being.',
    subject: 'English Language',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Identify verbs in sentences',
      'Understand present and past tense',
      'Use verbs correctly in writing',
      'Match subjects with appropriate verbs'
    ],
    keywords: ['verbs', 'grammar', 'action words', 'english', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 English - Second Term
  {
    title: 'Creative Writing and Storytelling',
    description: 'Write your own stories with beginning, middle, and end. Develop imagination and creativity.',
    subject: 'English Language',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1800,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 220,
    learningOutcomes: [
      'Write simple stories',
      'Use descriptive words',
      'Organize ideas with beginning, middle, end',
      'Share and present stories'
    ],
    keywords: ['writing', 'creative writing', 'stories', 'english', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Adjectives and Describing Words',
    description: 'Learn to use adjectives to make writing more interesting and descriptive.',
    subject: 'English Language',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1800,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify adjectives in sentences',
      'Use adjectives to describe nouns',
      'Compare using adjectives (big, bigger, biggest)',
      'Improve writing with descriptive words'
    ],
    keywords: ['adjectives', 'grammar', 'describing words', 'english', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 English - Third Term
  {
    title: 'Poetry and Rhyming',
    description: 'Explore poetry, learn rhyming words, and create simple poems.',
    subject: 'English Language',
    grade: 'Grade 2',
    term: 'Third Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify rhyming words',
      'Understand rhythm in poetry',
      'Write simple poems',
      'Recite poems with expression'
    ],
    keywords: ['poetry', 'rhyming', 'creative writing', 'english', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // ==================== SCIENCE TOPICS ====================
  
  // Grade 1 Science - First Term
  {
    title: 'My Body and Senses',
    description: 'Explore the human body and learn about the five senses - sight, hearing, touch, taste, and smell.',
    subject: 'Science',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify main body parts',
      'Name the five senses',
      'Understand how we use our senses',
      'Practice good hygiene habits'
    ],
    keywords: ['body', 'senses', 'health', 'science', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Living and Non-Living Things',
    description: 'Learn to distinguish between living and non-living things in our environment.',
    subject: 'Science',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify living things',
      'Identify non-living things',
      'Understand characteristics of living things',
      'Observe nature and classify objects'
    ],
    keywords: ['living things', 'nature', 'classification', 'science', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Science - Second Term
  {
    title: 'Plants Around Us',
    description: 'Discover different types of plants, their parts, and how they grow.',
    subject: 'Science',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1500,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify different types of plants',
      'Name parts of a plant (root, stem, leaf, flower)',
      'Understand what plants need to grow',
      'Care for plants'
    ],
    keywords: ['plants', 'nature', 'growth', 'science', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Animals and Their Homes',
    description: 'Learn about different animals and where they live.',
    subject: 'Science',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1500,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Identify common animals',
      'Know where different animals live',
      'Classify animals (pets, farm, wild)',
      'Understand how animals move'
    ],
    keywords: ['animals', 'habitats', 'nature', 'science', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Science - Third Term
  {
    title: 'Weather and Seasons',
    description: 'Explore different types of weather and learn about seasons.',
    subject: 'Science',
    grade: 'Grade 1',
    term: 'Third Term',
    price: 1500,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify different types of weather',
      'Understand sunny, rainy, cloudy, windy days',
      'Know about seasons (dry and rainy)',
      'Dress appropriately for weather'
    ],
    keywords: ['weather', 'seasons', 'climate', 'science', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Science - First Term
  {
    title: 'States of Matter',
    description: 'Learn about solids, liquids, and gases and how matter can change.',
    subject: 'Science',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Identify solids, liquids, and gases',
      'Understand properties of each state',
      'Observe changes in matter (melting, freezing)',
      'Give examples of each state'
    ],
    keywords: ['matter', 'states', 'solid', 'liquid', 'gas', 'science', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Energy and Forces',
    description: 'Introduction to energy, movement, and simple forces like push and pull.',
    subject: 'Science',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Understand push and pull forces',
      'Identify sources of energy',
      'Observe how things move',
      'Conduct simple force experiments'
    ],
    keywords: ['energy', 'forces', 'movement', 'science', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Science - Second Term
  {
    title: 'The Solar System',
    description: 'Explore the sun, moon, planets, and stars in our solar system.',
    subject: 'Science',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1800,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 200,
    learningOutcomes: [
      'Know the sun is a star',
      'Identify Earth\'s moon',
      'Name some planets',
      'Understand day and night'
    ],
    keywords: ['solar system', 'space', 'planets', 'science', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Life Cycles',
    description: 'Learn about life cycles of plants and animals, including butterflies and frogs.',
    subject: 'Science',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1800,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Understand what a life cycle is',
      'Describe the butterfly life cycle',
      'Describe the plant life cycle',
      'Observe changes in living things'
    ],
    keywords: ['life cycles', 'growth', 'nature', 'science', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Science - Third Term
  {
    title: 'Water and Its Importance',
    description: 'Discover the importance of water, the water cycle, and water conservation.',
    subject: 'Science',
    grade: 'Grade 2',
    term: 'Third Term',
    price: 1800,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Understand why water is important',
      'Know the water cycle basics',
      'Learn to conserve water',
      'Identify sources of water'
    ],
    keywords: ['water', 'water cycle', 'conservation', 'science', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // ==================== SOCIAL STUDIES TOPICS ====================
  
  // Grade 1 Social Studies - First Term
  {
    title: 'My Family and Home',
    description: 'Learn about families, roles of family members, and types of homes.',
    subject: 'Social Studies',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1200,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify family members',
      'Understand roles in the family',
      'Describe your home',
      'Respect family members'
    ],
    keywords: ['family', 'home', 'society', 'social studies', 'grade 1'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'My School and Community',
    description: 'Explore the school environment and the local community.',
    subject: 'Social Studies',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1200,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify school workers and their roles',
      'Follow school rules',
      'Know your community',
      'Identify community helpers'
    ],
    keywords: ['school', 'community', 'helpers', 'social studies', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Social Studies - Second Term
  {
    title: 'People Who Help Us',
    description: 'Learn about different professions and community helpers.',
    subject: 'Social Studies',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1200,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify community helpers (doctor, teacher, police)',
      'Understand what they do',
      'Show appreciation for helpers',
      'Learn about different jobs'
    ],
    keywords: ['community helpers', 'professions', 'society', 'social studies', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Social Studies - Third Term
  {
    title: 'Our Country Nigeria',
    description: 'Introduction to Nigeria - our flag, anthem, and being a Nigerian.',
    subject: 'Social Studies',
    grade: 'Grade 1',
    term: 'Third Term',
    price: 1200,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Know the colors of Nigerian flag',
      'Learn the national anthem',
      'Be proud to be Nigerian',
      'Know Nigeria is in Africa'
    ],
    keywords: ['Nigeria', 'patriotism', 'flag', 'social studies', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Social Studies - First Term
  {
    title: 'Location and Directions',
    description: 'Learn about maps, directions, and finding your way.',
    subject: 'Social Studies',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1400,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Understand basic directions (left, right, up, down)',
      'Read simple maps',
      'Find locations on a map',
      'Give simple directions'
    ],
    keywords: ['maps', 'directions', 'location', 'social studies', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Culture and Traditions',
    description: 'Explore Nigerian cultures, traditions, and festivals.',
    subject: 'Social Studies',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1400,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Understand what culture means',
      'Learn about different Nigerian cultures',
      'Know major festivals',
      'Respect cultural differences'
    ],
    keywords: ['culture', 'traditions', 'festivals', 'Nigeria', 'social studies', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Social Studies - Second Term
  {
    title: 'Economic Activities',
    description: 'Learn about buying, selling, and economic activities in the community.',
    subject: 'Social Studies',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1400,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 180,
    learningOutcomes: [
      'Understand buying and selling',
      'Know about markets',
      'Learn about needs and wants',
      'Value money and savings'
    ],
    keywords: ['economics', 'market', 'buying', 'selling', 'social studies', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Social Studies - Third Term
  {
    title: 'Transportation and Communication',
    description: 'Explore different means of transportation and communication.',
    subject: 'Social Studies',
    grade: 'Grade 2',
    term: 'Third Term',
    price: 1400,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify land, air, and water transport',
      'Understand road safety',
      'Know ways to communicate',
      'Learn about technology in communication'
    ],
    keywords: ['transportation', 'communication', 'technology', 'social studies', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // ==================== BASIC TECHNOLOGY TOPICS ====================
  
  // Grade 1 Basic Technology - First Term
  {
    title: 'Introduction to Technology',
    description: 'Discover what technology is and simple technological tools around us.',
    subject: 'Basic Technology',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1200,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 140,
    learningOutcomes: [
      'Understand what technology means',
      'Identify simple tools and machines',
      'Use basic tools safely',
      'Appreciate technology in daily life'
    ],
    keywords: ['technology', 'tools', 'machines', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Basic Technology - Second Term
  {
    title: 'Drawing and Coloring',
    description: 'Learn basic drawing skills and color recognition.',
    subject: 'Basic Technology',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1200,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 140,
    learningOutcomes: [
      'Draw simple shapes and objects',
      'Identify primary colors',
      'Color within lines',
      'Use drawing tools correctly'
    ],
    keywords: ['drawing', 'coloring', 'art', 'technology', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Basic Technology - First Term
  {
    title: 'Simple Machines',
    description: 'Learn about simple machines like levers, pulleys, and wheels.',
    subject: 'Basic Technology',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1400,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify simple machines',
      'Understand how machines help us',
      'Use tools safely',
      'Build simple projects'
    ],
    keywords: ['machines', 'tools', 'technology', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Basic Technology - Second Term
  {
    title: 'Introduction to Computers',
    description: 'Basic introduction to computers and their uses.',
    subject: 'Basic Technology',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1400,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Identify parts of a computer',
      'Know what computers are used for',
      'Use keyboard and mouse basics',
      'Practice computer safety'
    ],
    keywords: ['computers', 'ICT', 'technology', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // ==================== CREATIVE ARTS TOPICS ====================
  
  // Grade 1 Creative Arts - First Term
  {
    title: 'Music and Movement',
    description: 'Explore music, rhythm, and creative movement.',
    subject: 'Creative Arts',
    grade: 'Grade 1',
    term: 'First Term',
    price: 1200,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 140,
    learningOutcomes: [
      'Identify different sounds',
      'Clap simple rhythms',
      'Sing simple songs',
      'Move to music creatively'
    ],
    keywords: ['music', 'rhythm', 'movement', 'arts', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 1 Creative Arts - Second Term
  {
    title: 'Arts and Crafts',
    description: 'Create simple art and craft projects using various materials.',
    subject: 'Creative Arts',
    grade: 'Grade 1',
    term: 'Second Term',
    price: 1200,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 140,
    learningOutcomes: [
      'Create simple artwork',
      'Use different art materials',
      'Make craft projects',
      'Express creativity'
    ],
    keywords: ['arts', 'crafts', 'creativity', 'grade 1'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Creative Arts - First Term
  {
    title: 'Drama and Role Play',
    description: 'Learn basic drama skills through role play and simple performances.',
    subject: 'Creative Arts',
    grade: 'Grade 2',
    term: 'First Term',
    price: 1400,
    discountPercentage: 10,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Participate in role play',
      'Express emotions through drama',
      'Work in groups',
      'Build confidence in performance'
    ],
    keywords: ['drama', 'role play', 'performance', 'arts', 'grade 2'],
    isActive: true,
    isPublished: true,
  },

  // Grade 2 Creative Arts - Second Term
  {
    title: 'Painting and Design',
    description: 'Explore painting techniques and design principles.',
    subject: 'Creative Arts',
    grade: 'Grade 2',
    term: 'Second Term',
    price: 1400,
    discountPercentage: 15,
    difficulty: 'beginner',
    duration: 160,
    learningOutcomes: [
      'Use different painting techniques',
      'Mix colors',
      'Create designs and patterns',
      'Display artwork'
    ],
    keywords: ['painting', 'design', 'colors', 'arts', 'grade 2'],
    isActive: true,
    isPublished: true,
  },
];

// Function to connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Function to create topics
async function createTopics() {
  try {
    console.log('🚀 Starting topic creation...\n');

    // Clear existing topics (optional - comment out if you want to keep existing topics)
    const existingCount = await Topic.countDocuments();
    console.log(`📊 Found ${existingCount} existing topics in database`);
    
    const shouldClear = false; // Set to true if you want to clear existing topics
    if (shouldClear) {
      await Topic.deleteMany({});
      console.log('🗑️  Cleared existing topics\n');
    }

    // Create topics
    let successCount = 0;
    let errorCount = 0;

    for (const topicData of topics) {
      try {
        const topic = new Topic(topicData);
        await topic.save();
        successCount++;
        console.log(`✅ Created: ${topicData.title} (${topicData.subject} - ${topicData.grade} - ${topicData.term})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating ${topicData.title}:`, error.message);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Successfully created: ${successCount} topics`);
    console.log(`   ❌ Errors: ${errorCount} topics`);
    
    // Display breakdown by subject
    console.log('\n📚 Topics by Subject:');
    const subjects = {};
    topics.forEach(topic => {
      if (!subjects[topic.subject]) {
        subjects[topic.subject] = 0;
      }
      subjects[topic.subject]++;
    });
    
    Object.entries(subjects).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} topics`);
    });

  } catch (error) {
    console.error('❌ Error in topic creation:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await createTopics();
    console.log('\n✨ Topic creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
