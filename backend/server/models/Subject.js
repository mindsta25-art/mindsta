import mongoose from 'mongoose';
const { Schema } = mongoose;

const SubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Core', 'Science', 'Social', 'Languages', 'Arts', 'Technology', 'Practical', 'Religious', 'Business'],
      default: 'Core',
    },
    icon: {
      type: String,
      default: 'BookOpen',
    },
    color: {
      type: String,
      default: '#6366f1', // indigo-500
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubjectSchema.index({ name: 1 });
SubjectSchema.index({ category: 1 });
SubjectSchema.index({ isActive: 1 });

const Subject = mongoose.model('Subject', SubjectSchema);

export default Subject;
