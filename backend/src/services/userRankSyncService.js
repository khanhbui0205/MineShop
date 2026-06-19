const User = require('../models/User');
const minecraftService = require('./minecraftService');
const rankService = require('./rankService');
const { resolveMinecraftUsername } = require('../utils/userHelpers');

async function syncUserRankFromMinecraft(user, options = {}) {
  console.log(`[RANK SYNC] syncUserRankFromMinecraft entry: user=${user?.username || user?._id || '(empty)'}`);
  const fallback = rankService.resolveStoredRank(user?.rank);
  if (!user) return fallback;

  const userId = user._id;
  const minecraftUsername = resolveMinecraftUsername(user);
  console.log(`[RANK SYNC] Resolved Minecraft username: ${minecraftUsername || '(empty)'}`);
  if (!minecraftUsername) return fallback;

  try {
    console.log(`[RANK SYNC] Calling balance profile rank parser for ${minecraftUsername}`);
    const gameProfile = await minecraftService.getPlayerBalanceProfile(minecraftUsername, options);
    const gameRank = {
      rank: gameProfile.rank,
      rankKey: gameProfile.rankKey,
      rawGroup: gameProfile.rawGroup,
      syncedAt: new Date(),
    };
    console.log(`[RANK SYNC] Balance prefix rank returned for ${minecraftUsername}: ${gameRank.rank} (${gameRank.rankKey})`);
    if (userId && gameRank?.rank && user.rank !== gameRank.rank) {
      console.log(`[RANK SYNC] Updating User.rank for ${minecraftUsername}: ${user.rank || '(empty)'} -> ${gameRank.rank}`);
      await User.updateOne({ _id: userId }, { $set: { rank: gameRank.rank } });
    }

    return {
      rank: gameRank.rank,
      rankKey: gameRank.rankKey,
      rawGroup: gameRank.rawGroup,
      syncedAt: gameRank.syncedAt,
      fromCache: gameRank.fromCache,
    };
  } catch (error) {
    console.warn(`[RANK SYNC] Caught exception while syncing prefix rank for ${minecraftUsername}: ${error.message}`);
    return fallback;
  }
}

async function syncUserGameProfile(user, options = {}) {
  if (!user) {
    return {
      balance: 0,
      rank: 'Member',
      rankKey: 'default',
    };
  }

  const minecraftUsername = resolveMinecraftUsername(user);
  const storedRank = rankService.resolveStoredRank(user.rank);
  const fallback = {
    balance: user.balance || 0,
    rank: storedRank.rank,
    rankKey: storedRank.rankKey,
  };

  if (!minecraftUsername) return fallback;

  let gameProfile = fallback;
  try {
    console.log(`[PROFILE SYNC] Syncing balance and rank prefix for ${minecraftUsername}`);
    gameProfile = await minecraftService.getPlayerBalanceProfile(minecraftUsername, options);
    console.log(`[PROFILE SYNC] Balance/rank sync completed for ${minecraftUsername}: balance=${gameProfile.balance}, rank=${gameProfile.rank}`);
  } catch (error) {
    console.warn(`[PROFILE SYNC] Balance/rank sync failed for ${minecraftUsername}: ${error.message}`);
  }

  return {
    balance: gameProfile.balance,
    rank: gameProfile.rank,
    rankKey: gameProfile.rankKey,
    rankSyncedAt: new Date(),
  };
}

module.exports = {
  syncUserRankFromMinecraft,
  syncUserGameProfile,
};
