import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../server/models/Subject.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

async function checkSubjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const subjects = await Subject.find({});
    console.log(`\n📊 Found ${subjects.length} subject(s) in database:`);
    
    if (subjects.length > 0) {
      subjects.forEach((subject, index) => {
        console.log(`\n${index + 1}. Name: ${subject.name}`);
        console.log(`   Category: ${subject.category}`);
        console.log(`   Description: ${subject.description}`);
        console.log(`   Active: ${subject.isActive}`);
        console.log(`   Order: ${subject.order}`);
        console.log(`   ID: ${subject._id}`);
      });
    } else {
      console.log('\n❌ No subjects found in the database!');
      console.log('\n💡 Subjects need to be added via the Subject Management page in the admin panel.');
      console.log('   The admin can add subjects at: http://localhost:8080/admin/subjects');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSubjects();
