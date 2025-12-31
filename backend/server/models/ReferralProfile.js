import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReferralProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bankName: { type: String },
    bankCode: { type: String },
    accountNumber: { type: String },
    accountName: { type: String },
    commissionRate: { type: Number, default: 0.1 }, // 10% default
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    paidOutEarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Note: userId already has a unique index from the schema definition

export default mongoose.models.ReferralProfile || mongoose.model('ReferralProfile', ReferralProfileSchema);
