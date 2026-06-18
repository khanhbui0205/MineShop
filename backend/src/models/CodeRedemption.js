const mongoose = require('mongoose');

const codeRedemptionSchema = new mongoose.Schema(
  {
    codeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RedeemCode',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

codeRedemptionSchema.index({ codeId: 1, userId: 1 }, { unique: true });
codeRedemptionSchema.index({ redeemedAt: -1 });

module.exports = mongoose.model('CodeRedemption', codeRedemptionSchema);
