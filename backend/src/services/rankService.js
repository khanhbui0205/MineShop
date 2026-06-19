const RANK_MAP = {
  default: { rankKey: 'default', rank: 'Member' },
  vip: { rankKey: 'vip', rank: 'VIP' },
  vipplus: { rankKey: 'vipplus', rank: 'VIP+' },
  mvp: { rankKey: 'mvp', rank: 'MVP' },
};

function normalizeRankKey(group) {
  const key = String(group || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .replace(/\+/g, 'plus');

  return RANK_MAP[key] ? key : null;
}

function mapRankKey(rankKey) {
  return RANK_MAP[rankKey] || null;
}

function resolveStoredRank(userRank) {
  const rankKey = normalizeRankKey(userRank);
  if (rankKey) return mapRankKey(rankKey);

  const display = String(userRank || '').trim().toLowerCase();
  if (display === 'member') return RANK_MAP.default;
  if (display === 'vip+') return RANK_MAP.vipplus;
  if (display === 'vip') return RANK_MAP.vip;
  if (display === 'mvp') return RANK_MAP.mvp;

  return RANK_MAP.default;
}

function parseRankFromBalanceResponse(response, username) {
  const playerName = String(username || '').trim();
  const cleanResponse = String(response || '').replace(/\s+/g, ' ').trim();
  if (!playerName || !cleanResponse) return null;

  const usernameIndex = cleanResponse.toLowerCase().lastIndexOf(playerName.toLowerCase());
  const beforeUsername = usernameIndex >= 0 ? cleanResponse.slice(0, usernameIndex) : cleanResponse;
  const bracketMatches = [...beforeUsername.matchAll(/\[([^\]]+)\]/g)];

  for (let index = bracketMatches.length - 1; index >= 0; index -= 1) {
    const rawGroup = bracketMatches[index][1].trim();
    const rankKey = normalizeRankKey(rawGroup);
    if (!rankKey) continue;

    return {
      ...mapRankKey(rankKey),
      rawGroup,
    };
  }

  return RANK_MAP.default;
}

module.exports = {
  RANK_MAP,
  mapRankKey,
  normalizeRankKey,
  parseRankFromBalanceResponse,
  resolveStoredRank,
};
