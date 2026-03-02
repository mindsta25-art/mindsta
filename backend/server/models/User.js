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
    // OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null but enforce uniqueness when present
      index: true,
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
    // Email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      select: false, // Don't include in queries by default
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    verifiedAt: {
      type: Date,
    },
    // Security: Track failed login attempts
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    // Online/Offline tracking
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Notification preferences
    notificationPreferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      quizReminders: {
        type: Boolean,
        default: true,
      },
      progressUpdates: {
        type: Boolean,
        default: true,
      },
      weeklyReport: {
        type: Boolean,
        default: false,
      },
    },
    // Privacy settings
    privacySettings: {
      showProgress: {
        type: Boolean,
        default: true,
      },
      allowAnalytics: {
        type: Boolean,
        default: true,
      },
    },
    // Gamification fields
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklyGoal: {
      dailyLessons: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },
      enabled: {
        type: Boolean,
        default: true,
      },
    },
    streakFreezes: {
      available: {
        type: Number,
        default: 1,
        min: 0,
      },
      lastEarnedAt: {
        type: Date,
      },
    },
    studyReminders: {
      enabled: {
        type: Boolean,
        default: false,
      },
      time: {
        type: String, // Format: "HH:mm" (24-hour)
        default: "16:00",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    achievements: [{
      achievementId: {
        type: String,
        required: true,
      },
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
      progress: {
        type: Number,
        default: 0,
      },
    }],
    studyTimeData: [{
      date: {
        type: Date,
        required: true,
      },
      minutes: {
        type: Number,
        default: 0,
        min: 0,
      },
    }],
    subjectMastery: [{
      subject: {
        type: String,
        required: true,
      },
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Master'],
        default: 'Beginner',
      },
      xp: {
        type: Number,
        default: 0,
        min: 0,
      },
      lessonsCompleted: {
        type: Number,
        default: 0,
      },
    }],
    milestones: [{
      milestoneId: {
        type: String,
        required: true,
      },
      achievedAt: {
        type: Date,
        default: Date.now,
      },
      lessonsCount: {
        type: Number,
        required: true,
      },
    }],
    leaderboardSettings: {
      visible: {
        type: Boolean,
        default: true,
      },
      showFullName: {
        type: Boolean,
        default: false,
      },
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

// Check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If lock has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 15 * 60 * 1000; // 15 minutes
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Removed redundant index({ email: 1 }) because the field already has unique:true
// Mongoose warning about duplicate index came from declaring both unique and an explicit index.
// unique:true creates the index automatically.
UserSchema.index({ userType: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isVerified: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
