const rconService = require('./rconService');
const PendingReward = require('../models/PendingReward');

const PLAYER_NAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;
const MATERIAL_REGEX = /^[A-Z0-9_]+$/;

function stripMinecraftColorCodes(value) {
  return String(value || '').replace(/(?:\u00a7|Â§)[0-9a-fk-or]/gi, '');
}

function assertSafePlayerName(username) {
  if (!PLAYER_NAME_REGEX.test(username || '')) {
    throw new Error('Username khong hop le de cap thuong Minecraft');
  }
}

function normalizeItems(items = []) {
  return items.map((item) => ({
    material: String(item.material || '').trim().toUpperCase(),
    amount: Number(item.amount),
  }));
}

function validateRewardPayload({ rewardType, coinAmount = 0, items = [] }) {
  if (!['COIN', 'ITEM'].includes(rewardType)) {
    return 'Loai thuong khong hop le';
  }

  if (rewardType === 'COIN') {
    if (!Number.isSafeInteger(Number(coinAmount)) || Number(coinAmount) <= 0) {
      return 'So coin phai lon hon 0';
    }
    return null;
  }

  if (!Array.isArray(items) || items.length === 0) {
    return 'Vui long them it nhat 1 item';
  }

  const normalizedItems = normalizeItems(items);
  const invalidItem = normalizedItems.find((item) => (
    !MATERIAL_REGEX.test(item.material)
    || !Number.isSafeInteger(item.amount)
    || item.amount <= 0
  ));

  if (invalidItem) {
    return 'Material hoac so luong item khong hop le';
  }

  return null;
}

async function isPlayerOnline(username) {
  assertSafePlayerName(username);

  try {
    const response = await rconService.sendCommand('list');
    const cleanResponse = stripMinecraftColorCodes(response).toLowerCase();
    const cleanUsername = username.toLowerCase();
    const escapedUsername = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactNameRegex = new RegExp(`(^|[\\s,])${escapedUsername}($|[\\s,])`, 'i');
    return exactNameRegex.test(cleanResponse);
  } catch (error) {
    console.warn('[REWARD] Khong the kiem tra player online:', error.message);
    return false;
  }
}

function buildRewardCommands(username, reward) {
  assertSafePlayerName(username);

  if (reward.rewardType === 'COIN') {
    const coinAmount = Number(reward.coinAmount || 0);
    if (!Number.isSafeInteger(coinAmount) || coinAmount <= 0) {
      throw new Error('So coin khong hop le');
    }
    return [`eco give ${username} ${coinAmount}`];
  }

  const items = normalizeItems(reward.items || []);
  if (!items.length) {
    throw new Error('Danh sach item trong');
  }

  return items.map((item) => {
    if (!MATERIAL_REGEX.test(item.material) || !Number.isSafeInteger(item.amount) || item.amount <= 0) {
      throw new Error('Item reward khong hop le');
    }
    return `give ${username} ${item.material.toLowerCase()} ${item.amount}`;
  });
}

async function executeReward(username, reward) {
  const commands = buildRewardCommands(username, reward);
  const responses = [];

  for (const command of commands) {
    const response = await rconService.sendCommand(command);
    responses.push({ command, response });
  }

  return responses;
}

async function createPendingReward({ userId, username, rewardType, coinAmount = 0, items = [] }) {
  assertSafePlayerName(username);

  return PendingReward.create({
    userId,
    username,
    rewardType,
    coinAmount: rewardType === 'COIN' ? Number(coinAmount) : 0,
    items: rewardType === 'ITEM' ? normalizeItems(items) : [],
    status: 'PENDING',
  });
}

async function processPendingRewardsForUsername(username, options = {}) {
  assertSafePlayerName(username);

  const limit = Number(options.limit || 50);
  const rewards = await PendingReward.find({
    username,
    status: 'PENDING',
  }).sort({ createdAt: 1 }).limit(limit);

  const processed = [];
  const failed = [];

  for (const reward of rewards) {
    try {
      const responses = await executeReward(username, reward);
      reward.status = 'COMPLETED';
      reward.processedAt = new Date();
      await reward.save();
      processed.push({ rewardId: reward._id, responses });
    } catch (error) {
      console.warn(`[REWARD] Pending reward ${reward._id} failed:`, error.message);
      failed.push({ rewardId: reward._id, error: error.message });
    }
  }

  return {
    total: rewards.length,
    completed: processed.length,
    failed: failed.length,
    processed,
    failedRewards: failed,
  };
}

module.exports = {
  PLAYER_NAME_REGEX,
  MATERIAL_REGEX,
  normalizeItems,
  validateRewardPayload,
  isPlayerOnline,
  executeReward,
  createPendingReward,
  processPendingRewardsForUsername,
};
