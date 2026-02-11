import mongoose from 'mongoose';

const SuggestionSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200,
    trim: true
  },
  description: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true
  },
  subject: {
    type: String,
    required: false,
    trim: true
  },
  grade: {
    type: String,
    required: false,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    required: false,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
SuggestionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Suggestion = mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);
export default Suggestion;
