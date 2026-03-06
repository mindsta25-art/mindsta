import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGODB_URI);

const email = process.argv[2] || 'danielenuabanosa@gmail.com';
const newPassword = process.argv[3] || 'Mindsta2024!';

const hashed = await bcrypt.hash(newPassword, 12);
const r = await mongoose.connection.collection('users').updateOne(
  { email },
  { $set: { password: hashed, isVerified: true, loginAttempts: 0, lockUntil: null } }
);

if (r.modifiedCount) {
  console.log(`✅ Password reset for: ${email}`);
  console.log(`   New password: ${newPassword}`);
} else {
  console.log(`❌ User not found: ${email}`);
}

await mongoose.disconnect();
process.exit(0);
