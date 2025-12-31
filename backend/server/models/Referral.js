import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReferralSchema = new Schema(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referredEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
    rewardClaimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ referredEmail: 1 });
ReferralSchema.index({ status: 1 });

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
