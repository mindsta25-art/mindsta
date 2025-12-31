import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    // Reference to the lesson/course being reviewed
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    // Reference to the user who wrote the review
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // User's full name (denormalized for performance)
    userName: {
      type: String,
      required: true,
    },
    // Rating from 1-5 stars
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    // Review title/headline
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    // Review content/comment
    comment: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    // Helpfulness tracking
    helpfulCount: {
      type: Number,
      default: 0,
    },
    // Users who marked this review as helpful
    helpfulBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Instructor response to the review
    instructorResponse: {
      comment: String,
      respondedAt: Date,
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Review status
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged'],
      default: 'active',
    },
    // Whether the reviewer completed the course
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Course completion percentage at time of review
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per user per lesson
ReviewSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

// Index for sorting by helpful count
ReviewSchema.index({ lessonId: 1, helpfulCount: -1 });

// Index for filtering by rating
ReviewSchema.index({ lessonId: 1, rating: 1 });

// Virtual for checking if user found review helpful
ReviewSchema.methods.isHelpfulBy = function(userId) {
  return this.helpfulBy.some(id => id.toString() === userId.toString());
};

// Static method to calculate average rating for a lesson
ReviewSchema.statics.calculateAverageRating = async function(lessonId) {
  const result = await this.aggregate([
    {
      $match: {
        lessonId: new mongoose.Types.ObjectId(lessonId),
        status: 'active',
      },
    },
    {
      $group: {
        _id: '$lessonId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (result.length > 0) {
    const stats = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
      averageRating: Math.round(stats.averageRating * 10) / 10,
      totalReviews: stats.totalReviews,
      ratingDistribution: distribution,
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
};

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
