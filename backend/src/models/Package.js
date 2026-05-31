const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên gói'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá gói'],
      min: [0, 'Giá không được âm'],
    },
    coinAmount: {
      type: Number,
      required: [true, 'Vui lòng nhập số coin'],
      min: [0, 'Số coin không được âm'],
    },
    bonusCoin: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['Coin', 'VIP', 'Pass'],
      default: 'Coin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Package', packageSchema);
