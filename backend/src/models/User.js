const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Vui lòng nhập tên người dùng'],
      unique: true,
      trim: true,
      minlength: [3, 'Tên người dùng phải có ít nhất 3 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Vui lòng nhập email hợp lệ',
      ],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    balance: {
      type: Number,
      default: 0,
    },
    totalDeposited: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      default: 'Member',
    },
    battlePassLevel: {
      type: Number,
      default: 1,
    },
    battlePassXp: {
      type: Number,
      default: 0,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: '',
    },
    banExpiresAt: {
      type: Date,
      default: null, // null = vĩnh viễn
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    minecraftUsername: {
      type: String,
      default: '',
      index: {
        unique: true,
        partialFilterExpression: { minecraftUsername: { $type: 'string', $gt: '' } },
      },
      trim: true,
    },
    minecraftVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
