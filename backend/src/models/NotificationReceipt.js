const mongoose = require('mongoose');

const notificationReceiptSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationReceiptSchema.index({ notificationId: 1, userId: 1 }, { unique: true });
notificationReceiptSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationReceipt', notificationReceiptSchema);
