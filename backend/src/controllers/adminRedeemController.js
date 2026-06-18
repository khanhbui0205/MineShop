const RedeemCode = require('../models/RedeemCode');
const CodeRedemption = require('../models/CodeRedemption');
const PendingReward = require('../models/PendingReward');
const {
  normalizeItems,
  normalizeCommands,
  validateRewardCommands,
  validateRewardPayload,
} = require('../services/rewardService');

function normalizeCodeInput(value) {
  return String(value || '').trim().toUpperCase();
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function defaultCommandsForReward({ rewardType, coinAmount = 0, items = [] }) {
  const commands = [];

  if (rewardType === 'COIN' || rewardType === 'BOTH') {
    commands.push(`eco give {player} ${Number(coinAmount || 0)}`);
  }

  if (rewardType === 'ITEM' || rewardType === 'BOTH') {
    commands.push(...normalizeItems(items).map((item) => (
      `give {player} ${item.material.toLowerCase()} ${item.amount}`
    )));
  }

  return commands;
}

function buildCodePayload(body, existing = {}) {
  const rewardType = body.rewardType ?? existing.rewardType;
  const coinAmount = Number(body.coinAmount ?? existing.coinAmount ?? 0);
  const items = normalizeItems(body.items ?? existing.items ?? []);
  let commands = normalizeCommands(body.commands ?? existing.commands ?? []);
  const rewardError = validateRewardPayload({ rewardType, coinAmount, items });

  if (rewardError) {
    return { error: rewardError };
  }

  if (commands.length === 0) {
    commands = defaultCommandsForReward({ rewardType, coinAmount, items });
  }

  const commandError = validateRewardCommands(commands);
  if (commandError) {
    return { error: commandError };
  }

  const code = body.code !== undefined ? normalizeCodeInput(body.code) : existing.code;
  const name = body.name !== undefined ? String(body.name || '').trim() : existing.name;
  const maxUses = Number(body.maxUses ?? existing.maxUses ?? 0);
  const maxPlayerAgeDays = Number(body.maxPlayerAgeDays ?? existing.maxPlayerAgeDays ?? 0);
  const newbieOnly = Boolean(body.newbieOnly ?? existing.newbieOnly ?? false);

  if (!code) return { error: 'Vui long nhap code' };
  if (!name) return { error: 'Vui long nhap ten code' };
  if (!Number.isSafeInteger(maxUses) || maxUses < 0) return { error: 'Gioi han luot su dung khong hop le' };
  if (!Number.isSafeInteger(maxPlayerAgeDays) || maxPlayerAgeDays < 0) return { error: 'So ngay tan thu khong hop le' };
  if (newbieOnly && maxPlayerAgeDays <= 0) return { error: 'Code tan thu can so ngay toi da lon hon 0' };

  const startDate = body.startDate !== undefined ? parseDateInput(body.startDate) : existing.startDate ?? null;
  const endDate = body.endDate !== undefined ? parseDateInput(body.endDate) : existing.endDate ?? null;

  if (startDate && endDate && startDate > endDate) {
    return { error: 'Ngay bat dau phai truoc ngay ket thuc' };
  }

  return {
    payload: {
      code,
      name,
      description: body.description !== undefined ? String(body.description || '').trim() : existing.description ?? '',
      rewardType,
      coinAmount: rewardType !== 'ITEM' ? coinAmount : 0,
      items: rewardType !== 'COIN' ? items : [],
      commands,
      maxUses,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive ?? true,
      newbieOnly,
      maxPlayerAgeDays: newbieOnly ? maxPlayerAgeDays : 0,
      startDate,
      endDate,
    },
  };
}

// @desc    Get redeem codes and recent redemption history
// @route   GET /api/admin/codes
// @access  Private/Admin
exports.getCodes = async (req, res) => {
  try {
    const now = new Date();
    const [codes, redemptions, totalRedeems, pendingCount, completedCount] = await Promise.all([
      RedeemCode.find().sort({ createdAt: -1 }).lean(),
      CodeRedemption.find()
        .populate('userId', 'username email')
        .populate('codeId', 'name rewardType coinAmount items commands')
        .sort({ redeemedAt: -1 })
        .limit(100)
        .lean(),
      CodeRedemption.countDocuments(),
      PendingReward.countDocuments({ status: 'PENDING' }),
      PendingReward.countDocuments({ status: 'COMPLETED' }),
    ]);

    res.json({
      codes,
      redemptions,
      stats: {
        totalCodes: codes.length,
        totalRedeems,
        activeCodes: codes.filter((code) => code.isActive && (!code.endDate || new Date(code.endDate) >= now)).length,
        expiredCodes: codes.filter((code) => code.endDate && new Date(code.endDate) < now).length,
        pendingRewards: pendingCount,
        completedRewards: completedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create redeem code
// @route   POST /api/admin/codes
// @access  Private/Admin
exports.createCode = async (req, res) => {
  try {
    const built = buildCodePayload(req.body);
    if (built.error) return res.status(400).json({ message: built.error });

    const code = await RedeemCode.create(built.payload);
    res.status(201).json(code);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Code nay da ton tai' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update redeem code
// @route   PUT /api/admin/codes/:id
// @access  Private/Admin
exports.updateCode = async (req, res) => {
  try {
    const code = await RedeemCode.findById(req.params.id);
    if (!code) return res.status(404).json({ message: 'Khong tim thay code' });

    const built = buildCodePayload(req.body, code.toObject());
    if (built.error) return res.status(400).json({ message: built.error });

    Object.assign(code, built.payload);
    await code.save();
    res.json(code);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Code nay da ton tai' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete redeem code
// @route   DELETE /api/admin/codes/:id
// @access  Private/Admin
exports.deleteCode = async (req, res) => {
  try {
    const code = await RedeemCode.findById(req.params.id);
    if (!code) return res.status(404).json({ message: 'Khong tim thay code' });

    await code.deleteOne();
    res.json({ message: 'Da xoa redeem code' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
