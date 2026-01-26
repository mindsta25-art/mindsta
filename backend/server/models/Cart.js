import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  // Item type: 'topic' or 'lesson'
  itemType: {
    type: String,
    enum: ['topic', 'lesson', 'subject'],
    default: 'lesson',
  },
  // Reference to Topic or Lesson
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
  },
  // Metadata for quick access
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  term: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  imageUrl: {
    type: String,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.price, 0);
  this.updatedAt = new Date();
  next();
});

// Note: userId already has a unique index from the schema definition

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
