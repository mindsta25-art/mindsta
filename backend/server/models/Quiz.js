import mongoose from 'mongoose';
const { Schema } = mongoose;

const QuestionSchema = new Schema({
  question: { type: String, required: true },
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

QuizSchema.index({ lessonId: 1 });

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
