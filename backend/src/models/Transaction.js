const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Deposit', 'Store Purchase', 'Battle Pass'],
      required: true,
    },
    item: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    coinsChange: {
      type: Number,
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    orderCode: {
      type: Number,
      unique: true,
    },
    paymentMethod: {
      type: String,
      default: 'PayOS',
    },
    transactionId: String,
    payosOrderId: String,
    paymentUrl: String,
    qrCode: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'expired', 'completed', 'claimed', 'Completed', 'Claimed'],
      default: 'pending',
    },
    playerName: {
      type: String,
      trim: true,
    },
    accountNumber: String,
    accountName: String,
    description: String,
    bankName: String,
    rewardDelivered: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
