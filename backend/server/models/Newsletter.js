import mongoose from 'mongoose';
const { Schema } = mongoose;

const NewsletterSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['home', 'student', 'settings'],
      default: 'home',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NewsletterSchema.index({ isActive: 1 });

const Newsletter = mongoose.model('Newsletter', NewsletterSchema);

export default Newsletter;
