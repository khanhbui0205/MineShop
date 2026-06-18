const rconService = require('./rconService');
const PendingReward = require('../models/PendingReward');
const CodeRedemption = require('../models/CodeRedemption');
const { publishUserEvent } = require('./notificationRealtimeService');

const PLAYER_NAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;
const MATERIAL_REGEX = /^[A-Z0-9_]+$/;

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

function normalizeCommands(commands = []) {
  if (typeof commands === 'string') {
    commands = commands.split('\n');
  }

  if (!Array.isArray(commands)) return [];

  return commands
    .map((command) => String(command || '').trim())
    .filter(Boolean)
    .map((command) => command.startsWith('/') ? command.slice(1).trim() : command);
}

function validateRewardCommands(commands = []) {
  const normalizedCommands = normalizeCommands(commands);

  if (normalizedCommands.length === 0) {
    return 'Vui long nhap it nhat 1 lenh RCON cho redeem code';
  }

  const invalidCommand = normalizedCommands.find((command) => !command.includes('{player}'));
  if (invalidCommand) {
    return 'Moi lenh RCON phai chua {player} de thay bang username cua nguoi redeem';
  }

  return null;
}

function validateRewardPayload({ rewardType, coinAmount = 0, items = [] }) {
  if (!['COIN', 'ITEM', 'BOTH'].includes(rewardType)) {
    return 'Loai thuong khong hop le';
  }

  if (rewardType === 'COIN' || rewardType === 'BOTH') {
    if (!Number.isSafeInteger(Number(coinAmount)) || Number(coinAmount) <= 0) {
      return 'So coin phai lon hon 0';
    }
  }

  if (rewardType === 'ITEM' || rewardType === 'BOTH') {
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
  }

  return null;
}

async function isPlayerOnline(username) {
  assertSafePlayerName(username);

  try {
    const response = await rconService.sendCommand('list');
    return isUsernameInListResponse(username, response);
  } catch (error) {
    console.warn('[REWARD] Khong the kiem tra player online:', error.message);
    return false;
  }
}

function isUsernameInListResponse(username, listResponse) {
  if (!PLAYER_NAME_REGEX.test(username || '')) return false;

  const cleanResponse = stripMinecraftColorCodes(listResponse);
  const onlinePlayers = parseOnlinePlayers(cleanResponse);
  if (onlinePlayers.some((playerName) => playerName.toLowerCase() === username.toLowerCase())) {
    return true;
  }

  const exactNameRegex = new RegExp(
    `(^|[^a-zA-Z0-9_])${escapeRegex(username)}([^a-zA-Z0-9_]|$)`,
    'i'
  );
  return exactNameRegex.test(cleanResponse);
}

function parseOnlinePlayers(listResponse) {
  const cleanResponse = stripMinecraftColorCodes(listResponse);
  const afterColon = cleanResponse.includes(':')
    ? cleanResponse.slice(cleanResponse.indexOf(':') + 1)
    : cleanResponse;

  return afterColon
    .split(',')
    .map((name) => name.trim())
    .filter((name) => PLAYER_NAME_REGEX.test(name));
}

async function getOnlinePlayers() {
  try {
    const response = await rconService.sendCommand('list');
    return parseOnlinePlayers(response);
  } catch (error) {
    console.warn('[REWARD] Khong the lay danh sach player online:', error.message);
    return [];
  }
}

function buildRewardCommands(username, reward) {
  assertSafePlayerName(username);

  const customCommands = normalizeCommands(reward.commands || []);
  if (customCommands.length > 0) {
    return customCommands.map((command) => command.replaceAll('{player}', username));
  }

  const commands = [];

  if (reward.rewardType === 'COIN' || reward.rewardType === 'BOTH') {
    const coinAmount = Number(reward.coinAmount || 0);
    if (!Number.isSafeInteger(coinAmount) || coinAmount <= 0) {
      throw new Error('So coin khong hop le');
    }
    commands.push(`eco give ${username} ${coinAmount}`);
  }

  if (reward.rewardType === 'ITEM' || reward.rewardType === 'BOTH') {
    const items = normalizeItems(reward.items || []);
    if (!items.length) {
      throw new Error('Danh sach item trong');
    }

    items.forEach((item) => {
      if (!MATERIAL_REGEX.test(item.material) || !Number.isSafeInteger(item.amount) || item.amount <= 0) {
        throw new Error('Item reward khong hop le');
      }
      commands.push(`give ${username} ${item.material.toLowerCase()} ${item.amount}`);
    });
  }

  return commands;
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

async function markLinkedRedemptionCompleted(reward) {
  if (reward.codeRedemptionId) {
    return CodeRedemption.findOneAndUpdate(
      { _id: reward.codeRedemptionId, status: 'PENDING' },
      { $set: { status: 'COMPLETED' } },
      { new: true }
    ).lean();
  }

  return CodeRedemption.findOneAndUpdate(
    {
      userId: reward.userId,
      username: { $regex: new RegExp(`^${String(reward.username).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: 'PENDING',
    },
    { $set: { status: 'COMPLETED' } },
    { sort: { redeemedAt: 1 } }
  );
}

function publishRedeemCompleted(reward, redemption, responses) {
  publishUserEvent([reward.userId], 'redeem:completed', {
    pendingRewardId: reward._id,
    codeRedemptionId: redemption?._id || reward.codeRedemptionId || null,
    username: reward.username,
    rewardType: reward.rewardType,
    coinAmount: reward.coinAmount,
    items: reward.items,
    status: 'COMPLETED',
    processedAt: reward.processedAt,
    responses,
  });
}

async function createPendingReward({ userId, codeRedemptionId = null, username, rewardType, coinAmount = 0, items = [], commands = [] }) {
  assertSafePlayerName(username);

  return PendingReward.create({
    userId,
    codeRedemptionId,
    username,
    rewardType,
    coinAmount: rewardType !== 'ITEM' ? Number(coinAmount) : 0,
    items: rewardType !== 'COIN' ? normalizeItems(items) : [],
    commands: normalizeCommands(commands),
    status: 'PENDING',
  });
}

async function processPendingRewardsForUsername(username, options = {}) {
  assertSafePlayerName(username);

  const limit = Number(options.limit || 50);
  const escapedUsername = escapeRegex(username);
  const rewards = await PendingReward.find({
    username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') },
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
      const redemption = await markLinkedRedemptionCompleted(reward);
      publishRedeemCompleted(reward, redemption, responses);
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

async function processPendingRewardsForOnlinePlayers(options = {}) {
  const pendingUsernames = await PendingReward.distinct('username', { status: 'PENDING' });
  if (pendingUsernames.length === 0) {
    return {
      onlinePlayers: [],
      checked: 0,
      total: 0,
      completed: 0,
      failed: 0,
      results: [],
    };
  }

  let listResponse = '';
  try {
    listResponse = await rconService.sendCommand('list');
  } catch (error) {
    console.warn('[REWARD] Khong the lay danh sach player online:', error.message);
    return {
      onlinePlayers: [],
      checked: 0,
      total: 0,
      completed: 0,
      failed: pendingUsernames.length,
      results: [],
      error: error.message,
    };
  }

  const onlinePlayers = parseOnlinePlayers(listResponse);
  const usernamesToProcess = pendingUsernames
    .filter((username) => isUsernameInListResponse(String(username), listResponse));

  const results = [];
  for (const username of usernamesToProcess) {
    const result = await processPendingRewardsForUsername(username, options);
    results.push({ username, ...result });
  }

  return {
    onlinePlayers,
    checked: usernamesToProcess.length,
    total: results.reduce((sum, item) => sum + item.total, 0),
    completed: results.reduce((sum, item) => sum + item.completed, 0),
    failed: results.reduce((sum, item) => sum + item.failed, 0),
    results,
  };
}

module.exports = {
  PLAYER_NAME_REGEX,
  MATERIAL_REGEX,
  normalizeItems,
  normalizeCommands,
  validateRewardCommands,
  validateRewardPayload,
  parseOnlinePlayers,
  isUsernameInListResponse,
  getOnlinePlayers,
  isPlayerOnline,
  executeReward,
  createPendingReward,
  processPendingRewardsForUsername,
  processPendingRewardsForOnlinePlayers,
};
