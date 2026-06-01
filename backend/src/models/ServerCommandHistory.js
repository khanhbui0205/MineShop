const mongoose = require('mongoose');

const serverCommandHistorySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    command: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      default: '',
    },
    success: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ServerCommandHistory', serverCommandHistorySchema);
