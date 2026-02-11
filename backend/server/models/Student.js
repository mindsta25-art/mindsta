import mongoose from 'mongoose';
const { Schema } = mongoose;

const StudentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    schoolName: {
      type: String,
      required: true,
    },
    // Payment gating flag: when true student can access paid content (lessons/exams)
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Learning streak tracking
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

StudentSchema.index({ userId: 1 });
StudentSchema.index({ grade: 1 });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);

