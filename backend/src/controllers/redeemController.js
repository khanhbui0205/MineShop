const RedeemCode = require('../models/RedeemCode');
const CodeRedemption = require('../models/CodeRedemption');
const User = require('../models/User');
const {
  PLAYER_NAME_REGEX,
  createPendingReward,
  executeReward,
  isPlayerOnline,
} = require('../services/rewardService');

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function codeValidityError(code, user) {
  const now = new Date();

  if (!code.isActive) return 'Code da bi tat';
  if (code.startDate && new Date(code.startDate) > now) return 'Code chua den ngay bat dau';
  if (code.endDate && new Date(code.endDate) < now) return 'Code da het han';
  if (code.maxUses > 0 && code.usedCount >= code.maxUses) return 'Code da het luot su dung';

  if (code.newbieOnly) {
    const maxDays = Number(code.maxPlayerAgeDays || 0);
    if (maxDays <= 0) return 'Code tan thu chua cau hinh so ngay toi da';

    const ageMs = now.getTime() - new Date(user.createdAt).getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    if (ageDays > maxDays) {
      return `Code chi danh cho tai khoan tao trong ${maxDays} ngay`;
    }
  }

  return null;
}

async function deliverRedeemReward(user, code, redemption) {
  const username = user.username;

  if (!PLAYER_NAME_REGEX.test(username)) {
    throw new Error('Username tai khoan khong hop le de cap thuong Minecraft');
  }

  if (code.rewardType === 'COIN') {
    const coinAmount = Number(code.coinAmount || 0);
    await User.updateOne({ _id: user._id }, { $inc: { balance: coinAmount } });

    const online = await isPlayerOnline(username);
    if (online) {
      try {
        await executeReward(username, { rewardType: 'COIN', coinAmount });
        redemption.status = 'COMPLETED';
        await redemption.save();
        return { deliveryStatus: 'COMPLETED', pendingReward: null };
      } catch (error) {
        console.warn('[REDEEM] Cap coin qua RCON that bai, tao pending:', error.message);
      }
    }

    const pendingReward = await createPendingReward({
      userId: user._id,
      username,
      rewardType: 'COIN',
      coinAmount,
    });
    redemption.status = 'PENDING';
    await redemption.save();
    return { deliveryStatus: 'PENDING', pendingReward };
  }

  const pendingReward = await createPendingReward({
    userId: user._id,
    username,
    rewardType: 'ITEM',
    items: code.items,
  });
  redemption.status = 'PENDING';
  await redemption.save();
  return { deliveryStatus: 'PENDING', pendingReward };
}

// @desc    Redeem a code for current logged-in user
// @route   POST /api/redeem
// @access  Private
exports.redeemCode = async (req, res) => {
  let redemption = null;
  let redeemCodeDoc = null;

  try {
    const normalizedCode = normalizeCode(req.body.code);
    if (!normalizedCode) {
      return res.status(400).json({ message: 'Vui long nhap code' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay tai khoan' });
    }

    redeemCodeDoc = await RedeemCode.findOne({ code: normalizedCode });
    if (!redeemCodeDoc) {
      return res.status(404).json({ message: 'Code khong ton tai' });
    }

    const validityError = codeValidityError(redeemCodeDoc, user);
    if (validityError) {
      return res.status(400).json({ message: validityError });
    }

    try {
      redemption = await CodeRedemption.create({
        codeId: redeemCodeDoc._id,
        userId: user._id,
        username: user.username,
        code: redeemCodeDoc.code,
        status: 'PENDING',
        redeemedAt: new Date(),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Tai khoan nay da su dung code nay' });
      }
      throw error;
    }

    const useLimitFilter = {
      _id: redeemCodeDoc._id,
      isActive: true,
    };
    if (redeemCodeDoc.maxUses > 0) {
      useLimitFilter.usedCount = { $lt: redeemCodeDoc.maxUses };
    }

    const incrementResult = await RedeemCode.updateOne(useLimitFilter, { $inc: { usedCount: 1 } });
    if (incrementResult.modifiedCount !== 1) {
      await redemption.deleteOne();
      return res.status(400).json({ message: 'Code da het luot su dung' });
    }

    redeemCodeDoc.usedCount += 1;
    const delivery = await deliverRedeemReward(user, redeemCodeDoc, redemption);

    const freshUser = await User.findById(user._id).select('balance username');
    res.json({
      message: delivery.deliveryStatus === 'COMPLETED'
        ? 'Redeem code thanh cong, thuong da duoc cap ngay'
        : 'Redeem code thanh cong, thuong se duoc cap khi player dang nhap',
      code: redeemCodeDoc.code,
      rewardType: redeemCodeDoc.rewardType,
      coinAmount: redeemCodeDoc.coinAmount,
      items: redeemCodeDoc.items,
      status: delivery.deliveryStatus,
      balance: freshUser?.balance ?? user.balance,
    });
  } catch (error) {
    if (redemption && redemption.status !== 'COMPLETED') {
      redemption.status = 'FAILED';
      await redemption.save().catch(() => {});
    }
    if (redeemCodeDoc && redemption) {
      await RedeemCode.updateOne({ _id: redeemCodeDoc._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => {});
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's redeem history
// @route   GET /api/redeem/history
// @access  Private
exports.getRedeemHistory = async (req, res) => {
  try {
    const history = await CodeRedemption.find({ userId: req.user._id })
      .populate('codeId', 'name description rewardType coinAmount items')
      .sort({ redeemedAt: -1 })
      .limit(100)
      .lean();

    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
