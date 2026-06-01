const mongoose = require('mongoose');

const packageExecutionLogSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    command: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    response: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PackageExecutionLog', packageExecutionLogSchema);
