import mongoose from 'mongoose';
const { Schema } = mongoose;

const SentNewsletterSchema = new Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentByEmail: {
      type: String,
      required: true,
    },
    totalSubscribers: {
      type: Number,
      required: true,
      default: 0,
    },
    sentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'partial', 'failed'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SentNewsletterSchema.index({ sentAt: -1 });
SentNewsletterSchema.index({ sentBy: 1 });
SentNewsletterSchema.index({ status: 1 });

const SentNewsletter = mongoose.model('SentNewsletter', SentNewsletterSchema);

export default SentNewsletter;
