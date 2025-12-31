import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'announcement', 'update'],
    default: 'info',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  targetAudience: {
    type: String,
    enum: ['all', 'grade-specific', 'individual'],
    default: 'all',
  },
  targetGrades: [{
    type: Number,
    min: 1,
    max: 7, // 1-6 for grades, 7 for Common Entrance
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null, // null means never expires
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  metadata: {
    icon: String,
    color: String,
    actionUrl: String,
    actionLabel: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
notificationSchema.index({ isActive: 1, createdAt: -1 });
notificationSchema.index({ targetAudience: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'readBy.userId': 1 });

// Virtual to check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to check if user has read the notification
notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.userId.toString() === userId.toString());
};

// Static method to get active notifications for a user
notificationSchema.statics.getActiveForUser = async function(userId, userGrade = null) {
  const now = new Date();
  
  const query = {
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ],
    $or: [
      { targetAudience: 'all' },
      { targetAudience: 'grade-specific', targetGrades: userGrade },
      { targetAudience: 'individual', targetUsers: userId }
    ]
  };

  return this.find(query)
    .populate('createdBy', 'username role')
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadForUser = async function(userId, userGrade = null) {
  const notifications = await this.getActiveForUser(userId, userGrade);
  return notifications.filter(notification => 
    !notification.readBy.some(read => read.userId.toString() === userId.toString())
  );
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findByIdAndUpdate(
    notificationId,
    {
      $addToSet: {
        readBy: {
          userId: userId,
          readAt: new Date()
        }
      }
    },
    { new: true }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
