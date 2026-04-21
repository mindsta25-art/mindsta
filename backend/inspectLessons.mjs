import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('No MONGODB_URI');
  process.exit(1);
}
const Lesson = (await import('./server/models/Lesson.js')).default;
await mongoose.connect(uri, { maxPoolSize: 2, serverSelectionTimeoutMS: 10000, socketTimeoutMS: 20000 });
const count = await Lesson.countDocuments();
console.log('lessonCount', count);
const sample = await Lesson.find().limit(5).select('subject grade term title isPublished price').lean();
console.log(JSON.stringify(sample, null, 2));
await mongoose.disconnect();
