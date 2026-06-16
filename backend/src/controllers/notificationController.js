const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const NotificationReceipt = require('../models/NotificationReceipt');
const User = require('../models/User');
const { addNotificationClient, publishNotification } = require('../services/notificationRealtimeService');

const NOTIFICATION_TYPES = ['system', 'promotion', 'payment', 'warning'];
const TARGET_TYPES = ['all', 'player'];

const serializeReceipt = (receipt) => {
  const notification = receipt.notificationId;
  if (!notification) return null;

  return {
    id: receipt._id,
    receiptId: receipt._id,
    notificationId: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    targetType: notification.targetType,
    targetPlayerName: notification.targetPlayerName,
    createdBy: notification.createdBy,
    createdAt: notification.createdAt,
    isRead: receipt.isRead,
    readAt: receipt.readAt,
  };
};

const getTargetUsers = async ({ targetType, targetPlayerName }) => {
  if (targetType === 'all') {
    return User.find({ role: { $ne: 'admin' } }).select('_id username minecraftUsername');
  }

  const playerName = String(targetPlayerName || '').trim();
  if (!playerName) return [];

  const matcher = new RegExp(`^${playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  return User.find({
    $or: [
      { minecraftUsername: matcher },
      { username: matcher },
    ],
  }).select('_id username minecraftUsername');
};

exports.createNotification = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const message = String(req.body.message || '').trim();
    const type = NOTIFICATION_TYPES.includes(req.body.type) ? req.body.type : 'system';
    const targetType = TARGET_TYPES.includes(req.body.targetType) ? req.body.targetType : 'all';
    const targetPlayerName = targetType === 'player' ? String(req.body.targetPlayerName || '').trim() : '';

    if (!title) return res.status(400).json({ message: 'Vui long nhap tieu de thong bao' });
    if (!message) return res.status(400).json({ message: 'Vui long nhap noi dung thong bao' });
    if (targetType === 'player' && !targetPlayerName) {
      return res.status(400).json({ message: 'Vui long nhap ten player' });
    }

    const targetUsers = await getTargetUsers({ targetType, targetPlayerName });
    if (targetUsers.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay user nhan thong bao' });
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      targetType,
      targetPlayerName,
      createdBy: req.user._id,
    });

    const receipts = await NotificationReceipt.insertMany(
      targetUsers.map((user) => ({
        notificationId: notification._id,
        userId: user._id,
      })),
      { ordered: false }
    );

    const populatedReceipts = await NotificationReceipt.find({
      _id: { $in: receipts.map((receipt) => receipt._id) },
    }).populate('notificationId');

    populatedReceipts.forEach((receipt) => {
      const payload = serializeReceipt(receipt);
      if (payload) publishNotification([receipt.userId], payload);
    });

    res.status(201).json({
      notification,
      recipientCount: receipts.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const receipts = await NotificationReceipt.find({ userId: req.user._id })
      .populate('notificationId')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(receipts.map(serializeReceipt).filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await NotificationReceipt.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    const conditions = [{ _id: id }, { notificationId: id }];

    const receipt = await NotificationReceipt.findOne({
      userId: req.user._id,
      $or: conditions,
    }).populate('notificationId');

    if (!receipt) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!receipt.isRead) {
      receipt.isRead = true;
      receipt.readAt = new Date();
      await receipt.save();
    }

    res.json(serializeReceipt(receipt));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const readAt = new Date();
    const result = await NotificationReceipt.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt } }
    );

    res.json({ modifiedCount: result.modifiedCount || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.streamNotifications = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const cleanup = addNotificationClient(user._id, res);
    const heartbeat = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      cleanup();
      res.end();
    });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
