import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
await mongoose.connect(uri);

const Lesson = mongoose.model('Lesson', new mongoose.Schema({}, { strict: false }), 'lessons');

const breakdown = await Lesson.aggregate([
  { $group: { _id: { subject: '$subject', grade: '$grade', term: '$term' }, count: { $sum: 1 }, titles: { $push: '$title' } } },
  { $sort: { '_id.subject': 1, '_id.grade': 1 } }
]);

console.log('\n=== Remaining Lessons by Subject/Grade/Term ===');
breakdown.forEach(b => {
  console.log(`\n[${b._id.subject}] Grade ${b._id.grade} - ${b._id.term} (${b.count} lesson${b.count > 1 ? 's' : ''})`);
  b.titles.forEach(t => console.log(`  - ${t}`));
});
console.log(`\nTOTAL: ${breakdown.reduce((a, b) => a + b.count, 0)} lessons across ${breakdown.length} groups`);

await mongoose.disconnect();
