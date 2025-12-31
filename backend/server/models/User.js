import mongoose from 'mongoose';
import crypto from 'crypto';
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      index: true,
      sparse: true,
    },
    passwordResetExpires: {
      type: Date,
    },
    fullName: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ['student', 'parent', 'educator', 'admin', 'referral'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but enforce uniqueness when present
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code before saving
UserSchema.pre('save', async function(next) {
  // Only generate referral code for referral users and if not already set
  if (this.userType === 'referral' && !this.referralCode) {
    let codeGenerated = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!codeGenerated && attempts < maxAttempts) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Check if code already exists
      const existingUser = await mongoose.models.User.findOne({ referralCode: code });
      if (!existingUser) {
        this.referralCode = code;
        codeGenerated = true;
      }
      attempts++;
    }
    
    if (!codeGenerated) {
      return next(new Error('Failed to generate unique referral code'));
    }
  }
  next();
});

// Removed redundant index({ email: 1 }) because the field already has unique:true
// Mongoose warning about duplicate index came from declaring both unique and an explicit index.
// unique:true creates the index automatically.
UserSchema.index({ userType: 1 });
UserSchema.index({ status: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
