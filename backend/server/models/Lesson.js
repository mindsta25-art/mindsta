import mongoose from 'mongoose';
const { Schema } = mongoose;

// Resource schema for downloadable materials
const ResourceSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['pdf', 'document', 'video', 'link', 'image', 'other'],
    default: 'link',
  },
  url: {
    type: String,
    required: true,
  },
  size: String,
  description: String,
});

// Lecture schema - individual content unit within a section
const LectureSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['video', 'article', 'quiz', 'assignment'],
    default: 'article',
  },
  content: {
    type: String,
  },
  videoUrl: {
    type: String,
  },
  duration: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
  resources: [ResourceSchema],
  isPreview: {
    type: Boolean,
    default: false,
  },
});

// Section schema - groups lectures together
const SectionSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  lectures: [LectureSchema],
});

const LessonSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    // Legacy content field for backward compatibility
    content: {
      type: String,
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
      enum: ['First Term', 'Second Term', 'Third Term'],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'],
      default: 'beginner',
    },
    // Total duration calculated from all lectures
    duration: {
      type: Number,
      default: 30,
    },
    // Course thumbnail/image
    imageUrl: {
      type: String,
    },
    // Legacy videoUrl for backward compatibility
    videoUrl: {
      type: String,
    },
    keywords: [String],
    learningObjectives: [String],
    // What students will learn (Udemy-style)
    whatYouWillLearn: [String],
    // Course requirements/prerequisites
    requirements: [String],
    // Target audience
    targetAudience: [String],
    // Curriculum structure
    curriculum: [SectionSchema],
    // Price in Naira
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Rating and reviews
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
    // Enrollment statistics
    enrolledStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

LessonSchema.index({ subject: 1, grade: 1, term: 1 });
LessonSchema.index({ grade: 1, term: 1 });
LessonSchema.index({ difficulty: 1 });

export default mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
