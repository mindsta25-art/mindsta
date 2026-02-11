import mongoose from 'mongoose';

const courseAnswerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  isInstructor: {
    type: Boolean,
    default: false
  },
  answer: {
    type: String,
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const courseQuestionSchema = new mongoose.Schema({
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
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  lessonTitle: String,
  question: {
    type: String,
    required: true
  },
  answers: [courseAnswerSchema],
  upvotes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

// Indexes
courseQuestionSchema.index({ subject: 1, grade: 1, term: 1 });
courseQuestionSchema.index({ userId: 1 });
courseQuestionSchema.index({ lessonId: 1 });
courseQuestionSchema.index({ status: 1 });
courseQuestionSchema.index({ createdAt: -1 });

export const CourseQuestion = mongoose.model('CourseQuestion', courseQuestionSchema);
