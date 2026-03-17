import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  userType: { type: String, enum: ['student', 'parent', 'educator', 'admin', 'referral'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const ADMIN = {
  email: 'admin@mindsta.com.ng',
  password: 'MindstaAdmin2024!',
  fullName: 'Mindsta Administrator',
  userType: 'admin',
  isVerified: true,
};

await mongoose.connect(MONGO_URI);
console.log('✅ Connected to production MongoDB Atlas');

const existing = await User.findOne({ email: ADMIN.email });
if (existing) {
  console.log('⚠️  Admin already exists:', existing.email, '| type:', existing.userType);
} else {
  const hashed = await bcrypt.hash(ADMIN.password, 12);
  await User.create({ ...ADMIN, password: hashed });
  console.log('\n✅ Admin created!');
  console.log('   Email:   ', ADMIN.email);
  console.log('   Password:', ADMIN.password);
  console.log('\n⚠️  Change this password after first login!\n');
}

await mongoose.disconnect();
process.exit(0);
