const mongoose = require('mongoose');

const pendingRewardItemSchema = new mongoose.Schema(
  {
    material: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const pendingRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    codeRedemptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodeRedemption',
      default: null,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rewardType: {
      type: String,
      enum: ['COIN', 'ITEM', 'BOTH'],
      required: true,
    },
    coinAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    items: {
      type: [pendingRewardItemSchema],
      default: [],
    },
    commands: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

pendingRewardSchema.index({ username: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('PendingReward', pendingRewardSchema);
