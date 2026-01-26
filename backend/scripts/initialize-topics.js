/**
 * Script to initialize sample topics for MINDSTA platform
 * Run this after creating lessons to organize them into topics
 * 
 * Usage: node backend/scripts/initialize-topics.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from '../server/models/Topic.js';
import { Lesson } from '../server/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

// Sample topics to create
const sampleTopics = [
  {
    title: 'Introduction to Algebra',
    description: 'Learn the fundamentals of algebra including variables, expressions, and equations',
    subject: 'Mathematics',
    grade: 'JSS 1',
    term: 'First Term',
    price: 2500,
    discountPercentage: 10,
    difficulty: 'beginner',
    learningOutcomes: [
      'Understand variables and algebraic expressions',
      'Solve simple linear equations',
      'Apply algebraic concepts to real-world problems'
    ],
    keywords: ['algebra', 'equations', 'variables', 'mathematics'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Basic English Grammar',
    description: 'Master the essential grammar rules for effective communication',
    subject: 'English Language',
    grade: 'JSS 1',
    term: 'First Term',
    price: 2000,
    discountPercentage: 15,
    difficulty: 'beginner',
    learningOutcomes: [
      'Understand parts of speech',
      'Construct proper sentences',
      'Use correct punctuation'
    ],
    keywords: ['grammar', 'english', 'language', 'writing'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Introduction to Physics',
    description: 'Explore the basic principles of physics and motion',
    subject: 'Physics',
    grade: 'SS 1',
    term: 'First Term',
    price: 3000,
    discountPercentage: 20,
    difficulty: 'intermediate',
    learningOutcomes: [
      'Understand motion and forces',
      'Apply Newton\'s laws of motion',
      'Calculate velocity and acceleration'
    ],
    keywords: ['physics', 'motion', 'forces', 'science'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Introduction to Chemistry',
    description: 'Learn the basics of chemistry including atoms, molecules, and chemical reactions',
    subject: 'Chemistry',
    grade: 'SS 1',
    term: 'First Term',
    price: 3000,
    discountPercentage: 20,
    difficulty: 'intermediate',
    learningOutcomes: [
      'Understand atomic structure',
      'Identify elements and compounds',
      'Understand chemical reactions and equations'
    ],
    keywords: ['chemistry', 'atoms', 'molecules', 'reactions', 'science'],
    isActive: true,
    isPublished: true,
  },
  {
    title: 'Nigerian History',
    description: 'Explore the rich history of Nigeria from pre-colonial times to independence',
    subject: 'History',
    grade: 'JSS 2',
    term: 'Second Term',
    price: 2200,
    discountPercentage: 10,
    difficulty: 'beginner',
    learningOutcomes: [
      'Understand Nigeria\'s pre-colonial kingdoms',
      'Learn about the colonial period',
      'Study the path to independence'
    ],
    keywords: ['history', 'nigeria', 'independence', 'colonial'],
    isActive: true,
    isPublished: true,
  },
];

async function initializeTopics() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if topics already exist
    const existingTopics = await Topic.countDocuments();
    console.log(`Found ${existingTopics} existing topics`);

    if (existingTopics > 0) {
      console.log('\n⚠️  Topics already exist. Do you want to:');
      console.log('1. Skip initialization');
      console.log('2. Add new topics (keep existing)');
      console.log('3. Replace all topics');
      console.log('\nFor safety, run this script with NODE_ENV=force to replace');
      
      if (process.env.NODE_ENV !== 'force') {
        console.log('Exiting without changes...');
        process.exit(0);
      }
    }

    console.log('\nCreating sample topics...');
    
    for (const topicData of sampleTopics) {
      // Check if topic already exists
      const existing = await Topic.findOne({
        title: topicData.title,
        subject: topicData.subject,
        grade: topicData.grade,
        term: topicData.term,
      });

      if (existing) {
        console.log(`⊘ Topic "${topicData.title}" already exists, skipping...`);
        continue;
      }

      // Create topic
      const topic = new Topic(topicData);
      await topic.save();
      console.log(`✓ Created topic: ${topic.title} (${topic.subject}, ${topic.grade}, ${topic.term})`);

      // Find matching lessons and add them to the topic
      const matchingLessons = await Lesson.find({
        subject: topicData.subject,
        grade: topicData.grade,
        term: topicData.term,
      }).limit(5); // Limit to first 5 lessons for now

      if (matchingLessons.length > 0) {
        topic.lessons = matchingLessons.map(l => l._id);
        await topic.save();
        console.log(`  → Added ${matchingLessons.length} lessons to topic`);
      } else {
        console.log(`  ⚠ No matching lessons found for this topic`);
      }
    }

    console.log('\n✓ Topic initialization completed successfully!');
    console.log('\nSummary:');
    const totalTopics = await Topic.countDocuments();
    const publishedTopics = await Topic.countDocuments({ isPublished: true });
    console.log(`Total topics: ${totalTopics}`);
    console.log(`Published topics: ${publishedTopics}`);

    // Show topics grouped by subject
    const topicsBySubject = await Topic.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          topics: { $push: '$title' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nTopics by Subject:');
    topicsBySubject.forEach(group => {
      console.log(`\n${group._id} (${group.count} topics):`);
      group.topics.forEach(title => console.log(`  - ${title}`));
    });

  } catch (error) {
    console.error('Error initializing topics:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the initialization
initializeTopics();
