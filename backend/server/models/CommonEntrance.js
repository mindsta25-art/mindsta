import mongoose from 'mongoose';
const { Schema } = mongoose;

const CEQuestionSchema = new Schema({
  question: { type: String, required: true },
  imageUrl: { type: String, default: null },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length === 4,
      message: 'Each question must have exactly 4 options.',
    },
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '' },
});

const CommonEntranceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },         // short description shown on card
    description: { type: String, default: '' },
    overview: { type: String, default: '' },          // rich-text overview for detail page
    subject: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    imageDisplaySize: { type: String, default: 'full', enum: ['full', 'large', 'medium', 'small'] },
    imageObjectFit: { type: String, default: 'cover', enum: ['cover', 'contain', 'fill'] },
    price: { type: Number, required: true, default: 0, min: 0 }, // price in Naira
    questions: {
      type: [CEQuestionSchema],
      validate: {
        // Allow any number of questions for drafts; published exams need exactly 50
        validator: function (v) {
          if (!this.isPublished) return true;
          return Array.isArray(v) && v.length === 50;
        },
        message: 'A published Common Entrance exam must have exactly 50 questions.',
      },
    },
    passingScore: { type: Number, default: 90, min: 1, max: 100 },
    timeLimit: { type: Number, default: 3600 }, // 60 minutes in seconds
    isPublished: { type: Boolean, default: true },
    enrolledStudents: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

CommonEntranceSchema.index({ subject: 1 });
CommonEntranceSchema.index({ isPublished: 1 });

export default mongoose.models.CommonEntrance ||
  mongoose.model('CommonEntrance', CommonEntranceSchema);
