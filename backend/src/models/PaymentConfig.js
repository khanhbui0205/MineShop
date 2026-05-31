const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'PayOS',
    },
    clientId: {
      type: String,
      default: '',
    },
    apiKey: {
      type: String,
      default: '',
    },
    checksumKey: {
      type: String,
      default: '',
    },
    webhookUrl: {
      type: String,
      default: '',
    },
    returnUrl: {
      type: String,
      default: '',
    },
    cancelUrl: {
      type: String,
      default: '',
    },
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
