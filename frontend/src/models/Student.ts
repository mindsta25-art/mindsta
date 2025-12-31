/**
 * Student Model (MongoDB)
 * Extended student information
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  grade: string;
  age: number;
  schoolName: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
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
      min: 5,
      max: 18,
    },
    schoolName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
StudentSchema.index({ userId: 1 });
StudentSchema.index({ grade: 1 });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
