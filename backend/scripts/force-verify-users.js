import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGODB_URI);

const emails = ['peace@gmail.com', 'excellent52222@gmail.com', 'danielenuabanosa@gmail.com'];
const r = await mongoose.connection.collection('users').updateMany(
  { email: { $in: emails } },
  { $set: { isVerified: true, verificationOTP: null, otpExpires: null } }
);
console.log('Force-verified:', r.modifiedCount, 'users');

await mongoose.disconnect();
process.exit(0);
