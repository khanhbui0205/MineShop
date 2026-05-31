const mongoose = require('mongoose');

const storeItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ['Coins', 'USD'],
      required: true,
    },
    badge: {
      type: String,
    },
    icon: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Rank', 'BattlePass', 'Coins', 'Cosmetic'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreItem', storeItemSchema);
