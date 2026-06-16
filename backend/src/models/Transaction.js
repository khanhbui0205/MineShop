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
      type: Number,
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
      enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'pending', 'completed', 'cancelled', 'failed'],
      default: 'PENDING',
    },
    playerName: {
      type: String,
      default: '',
    },
    minecraftUsername: {
      type: String,
      default: '',
    },
    accountNumber: String,
    accountName: String,
    description: String,
    bankName: String,
    rewardDelivered: {
      type: Boolean,
      default: false,
    },
    balanceCredited: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, status: 1, createdAt: -1 });
transactionSchema.index({ orderCode: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
