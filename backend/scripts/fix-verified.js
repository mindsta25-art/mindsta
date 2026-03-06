import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to Atlas');

const col = mongoose.connection.collection('users');

// Fix all users where isVerified field doesn't exist (old accounts)
const r1 = await col.updateMany(
  { isVerified: { $exists: false } },
  { $set: { isVerified: true } }
);
console.log('Fixed isVerified:undefined users:', r1.modifiedCount);

// Ensure all admin accounts are verified
const r2 = await col.updateMany(
  { userType: 'admin' },
  { $set: { isVerified: true } }
);
console.log('Fixed admin users:', r2.modifiedCount);

// Show final state
const users = await col.find({}, { projection: { email: 1, userType: 1, isVerified: 1, _id: 0 } }).toArray();
console.log('\nAll users:');
users.forEach(u => console.log(' -', u.email, '|', u.userType, '| verified:', u.isVerified));

await mongoose.disconnect();
process.exit(0);
