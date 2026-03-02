import mongoose from 'mongoose';

const AdminAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['new_user', 'new_purchase', 'referral_signup', 'referral_purchase', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Index for fast unread queries
AdminAlertSchema.index({ read: 1, createdAt: -1 });

const AdminAlert = mongoose.model('AdminAlert', AdminAlertSchema);
export default AdminAlert;
