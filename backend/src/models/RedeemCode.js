const mongoose = require('mongoose');

const redeemItemSchema = new mongoose.Schema(
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

const redeemCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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
      type: [redeemItemSchema],
      default: [],
    },
    commands: {
      type: [String],
      default: [],
    },
    maxUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    newbieOnly: {
      type: Boolean,
      default: false,
    },
    maxPlayerAgeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

redeemCodeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('RedeemCode', redeemCodeSchema);
