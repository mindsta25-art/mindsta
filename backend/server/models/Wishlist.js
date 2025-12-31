import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  term: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [wishlistItemSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

wishlistSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Note: userId already has a unique index from the schema definition

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
