import mongoose from 'mongoose';
const { Schema } = mongoose;

// Payment model tracks Paystack transactions and links to user/student
const PaymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    amount: { type: Number, required: true }, // Stored in base currency units (e.g. NGN Naira, not kobo)
    currency: { type: String, default: 'NGN' },
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['initialized','pending','success','failed','abandoned'], default: 'initialized', index: true },
    authorizationUrl: { type: String },
    accessCode: { type: String },
    channel: { type: String },
    paidAt: { type: Date },
    rawInitialize: { type: Schema.Types.Mixed },
    rawVerify: { type: Schema.Types.Mixed },
    // Cart items purchased in this transaction
    items: [{
      subject: { type: String, required: true },
      grade: { type: String, required: true },
      term: { type: String },
      price: { type: Number, required: true },
    }],
  },
  { timestamps: true }
);

// Indexes
// Note: reference already has a unique index from the schema definition
PaymentSchema.index({ userId: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
