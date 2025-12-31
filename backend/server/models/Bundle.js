import mongoose from 'mongoose';

const bundleSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
    enum: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Common Entrance']
  },
  name: {
    type: String,
    required: true,
    default: 'Starter Bundle'
  },
  description: {
    type: String,
    default: 'Complete package for this grade'
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    term: {
      type: String,
      default: 'First Term'
    }
  }],
  bundlePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String
  }],
  enrollmentCount: {
    type: Number,
    default: 0
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate discount percentage automatically if not provided
bundleSchema.pre('save', function(next) {
  if (this.subjects.length > 0 && this.bundlePrice) {
    const totalPrice = this.subjects.reduce((sum, subject) => sum + subject.price, 0);
    const savings = totalPrice - this.bundlePrice;
    this.discountPercentage = Math.round((savings / totalPrice) * 100);
  }
  next();
});

// Index for efficient querying
bundleSchema.index({ grade: 1, isActive: 1 });

const Bundle = mongoose.model('Bundle', bundleSchema);

export default Bundle;
