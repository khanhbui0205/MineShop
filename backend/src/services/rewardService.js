const rconService = require('./rconService');
const PendingReward = require('../models/PendingReward');
const CodeRedemption = require('../models/CodeRedemption');

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
    const onlinePlayers = parseOnlinePlayers(response);
    if (onlinePlayers.some((playerName) => playerName.toLowerCase() === username.toLowerCase())) {
      return true;
    }

    const cleanResponse = stripMinecraftColorCodes(response).toLowerCase();
    const cleanUsername = username.toLowerCase();
    const escapedUsername = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactNameRegex = new RegExp(`(^|[\\s,:])${escapedUsername}($|[\\s,])`, 'i');
    return exactNameRegex.test(cleanResponse);
  } catch (error) {
    console.warn('[REWARD] Khong the kiem tra player online:', error.message);
    return false;
  }
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

async function markLinkedRedemptionCompleted(reward) {
  if (reward.codeRedemptionId) {
    await CodeRedemption.updateOne(
      { _id: reward.codeRedemptionId, status: 'PENDING' },
      { $set: { status: 'COMPLETED' } }
    );
    return;
  }

  await CodeRedemption.findOneAndUpdate(
    {
      userId: reward.userId,
      username: { $regex: new RegExp(`^${String(reward.username).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: 'PENDING',
    },
    { $set: { status: 'COMPLETED' } },
    { sort: { redeemedAt: 1 } }
  );
}

async function createPendingReward({ userId, codeRedemptionId = null, username, rewardType, coinAmount = 0, items = [], commands = [] }) {
  assertSafePlayerName(username);

  return PendingReward.create({
    userId,
    codeRedemptionId,
    username,
    rewardType,
    coinAmount: rewardType === 'COIN' ? Number(coinAmount) : 0,
    items: rewardType === 'ITEM' ? normalizeItems(items) : [],
    commands: normalizeCommands(commands),
    status: 'PENDING',
  });
}

async function processPendingRewardsForUsername(username, options = {}) {
  assertSafePlayerName(username);

  const limit = Number(options.limit || 50);
  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
      await markLinkedRedemptionCompleted(reward);
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
  const onlinePlayers = await getOnlinePlayers();
  if (onlinePlayers.length === 0) {
    return {
      onlinePlayers,
      checked: 0,
      total: 0,
      completed: 0,
      failed: 0,
      results: [],
    };
  }

  const pendingUsernames = await PendingReward.distinct('username', { status: 'PENDING' });
  const onlineLookup = new Map(onlinePlayers.map((playerName) => [playerName.toLowerCase(), playerName]));
  const usernamesToProcess = pendingUsernames
    .filter((username) => onlineLookup.has(String(username).toLowerCase()))
    .map((username) => onlineLookup.get(String(username).toLowerCase()) || username);

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
  getOnlinePlayers,
  isPlayerOnline,
  executeReward,
  createPendingReward,
  processPendingRewardsForUsername,
  processPendingRewardsForOnlinePlayers,
};
