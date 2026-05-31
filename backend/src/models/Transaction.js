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
    status: {
      type: String,
      enum: ['Completed', 'Claimed', 'Pending'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
