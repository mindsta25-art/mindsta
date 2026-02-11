import mongoose from 'mongoose';

const courseReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  term: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
courseReviewSchema.index({ subject: 1, grade: 1, term: 1 });
courseReviewSchema.index({ userId: 1 });
courseReviewSchema.index({ createdAt: -1 });

export const CourseReview = mongoose.model('CourseReview', courseReviewSchema);
