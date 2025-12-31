import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReferralTransactionSchema = new Schema(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referralId: { type: Schema.Types.ObjectId, ref: 'Referral', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // paying user
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    amountPaid: { type: Number, required: true }, // Naira
    commissionAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending','paid'], default: 'pending', index: true },
    paidAt: { type: Date },
    payoutBatchId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

ReferralTransactionSchema.index({ referrerId: 1, createdAt: -1 });

export default mongoose.models.ReferralTransaction || mongoose.model('ReferralTransaction', ReferralTransactionSchema);
