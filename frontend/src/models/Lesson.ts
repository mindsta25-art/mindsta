/**
 * Lesson Model (MongoDB)
 * Learning content and lessons
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description: string;
  content: string;
  subject: string;
  grade: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  imageUrl?: string;
  videoUrl?: string;
  orderNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    estimatedDuration: {
      type: Number,
      required: true,
      default: 30,
    },
    imageUrl: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    orderNumber: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for common queries
LessonSchema.index({ grade: 1, subject: 1 });
LessonSchema.index({ grade: 1, orderNumber: 1 });

export default mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
