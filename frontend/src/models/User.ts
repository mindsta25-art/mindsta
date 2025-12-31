/**
 * User Model (MongoDB)
 * Handles authentication and user profiles
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  userType: 'student' | 'parent' | 'educator' | 'admin' | 'referral';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
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
    fullName: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ['student', 'parent', 'educator', 'admin', 'referral'],
      default: 'student',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ userType: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
