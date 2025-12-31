import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    quizScore: {
      type: Number,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1 });
UserProgressSchema.index({ lessonId: 1 });

export default mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);
