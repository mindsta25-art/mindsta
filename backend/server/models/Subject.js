import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Core', 'Science', 'Social', 'Languages', 'Arts', 'Technology', 'Practical', 'Religious', 'Business'],
    default: 'Core'
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'BookOpen'
  },
  color: {
    type: String,
    default: 'blue'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
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

// Update timestamp on save
SubjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
SubjectSchema.index({ isActive: 1, order: 1 });
SubjectSchema.index({ name: 1 });

const Subject = mongoose.model('Subject', SubjectSchema);

export default Subject;
