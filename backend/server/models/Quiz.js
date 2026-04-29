import mongoose from 'mongoose';
const { Schema } = mongoose;

const QuestionSchema = new Schema({
  question: { type: String, required: true },
  imageUrl: { type: String, default: null },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, required: true },
});

const QuizSchema = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Associate quiz with subject, grade, and term for better filtering
    subject: {
      type: String,
      required: true,
      index: true,
    },
    grade: {
      type: String,
      required: true,
      index: true,
    },
    term: {
      type: String,
      enum: ['First Term', 'Second Term', 'Third Term', 'Common Entrance'],
      required: true,
      index: true,
    },
    questions: [QuestionSchema],
    passingScore: {
      type: Number,
      default: 70,
    },
    timeLimit: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying by subject, grade, and term
QuizSchema.index({ subject: 1, grade: 1, term: 1 });
// One quiz per lesson — enforce at DB level
QuizSchema.index({ lessonId: 1 }, { unique: true });

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
