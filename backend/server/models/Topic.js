import mongoose from 'mongoose';
const { Schema } = mongoose;

const TopicSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    grade: {
      type: String,
      required: true,
      index: true,
    },
    term: {
      type: String,
      enum: ['First Term', 'Second Term', 'Third Term'],
      required: true,
      index: true,
    },
    // Associated lessons for this topic
    lessons: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    // Price for the entire topic (bundle of lessons)
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Discount if buying topic vs individual lessons
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Topic metadata
    order: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number, // Total duration in minutes
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'],
      default: 'beginner',
    },
    imageUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    // Learning outcomes
    learningOutcomes: [String],
    keywords: [String],
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    
    // Statistics
    enrolledStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Ratings
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // SEO
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient filtering
TopicSchema.index({ subject: 1, grade: 1, term: 1 });
TopicSchema.index({ grade: 1, term: 1 });
TopicSchema.index({ subject: 1, grade: 1 });
TopicSchema.index({ isActive: 1, isPublished: 1 });
// Note: slug index is defined in schema with unique: true, so no need to add here

// Generate slug before saving
TopicSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Calculate total duration from lessons
TopicSchema.methods.calculateDuration = async function() {
  await this.populate('lessons');
  if (this.lessons && this.lessons.length > 0) {
    this.duration = this.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  }
  return this.duration;
};

const Topic = mongoose.model('Topic', TopicSchema);

export default Topic;
