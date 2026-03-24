import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    term: {
      type: String,
      required: false,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional: tracks the specific lesson purchased (null = subject-level access for all lessons)
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index — includes lessonId so multiple per-lesson enrollments can exist
// for the same subject+grade+term. Run scripts/fix-enrollment-index.js once to drop
// the old unique (userId, subject, grade, term) index from the database.
EnrollmentSchema.index({ userId: 1, subject: 1, grade: 1, term: 1, lessonId: 1 });

// Index for quick lookup by user
EnrollmentSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);
