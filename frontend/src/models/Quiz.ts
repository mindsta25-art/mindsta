/**
 * Quiz Model (MongoDB)
 * Quizzes for lessons
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  orderNumber: number;
}

export interface IQuiz extends Document {
  lessonId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number;
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema: Schema = new Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer'],
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
  },
  points: {
    type: Number,
    required: true,
    default: 1,
  },
  orderNumber: {
    type: Number,
    required: true,
  },
});

const QuizSchema: Schema = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 70,
    },
    timeLimit: {
      type: Number,
    },
    questions: [QuizQuestionSchema],
  },
  {
    timestamps: true,
  }
);

// Create indexes
QuizSchema.index({ lessonId: 1 });

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
