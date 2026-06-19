const rconService = require('./rconService');
const rankService = require('./rankService');

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMinecraftFormatting(value) {
  return String(value || '')
    .replace(/(?:§|Â§|Ã‚Â§|&)[0-9A-FK-OR]/gi, '')
    .replace(/\u001b\[[0-9;]*m/g, '');
}


function normalizeNumericToken(token) {
  let value = String(token || '').trim();
  if (!value) return null;

  value = value.replace(/[^\d,.\-]/g, '').replace(/(?!^)-/g, '');
  if (!value || value === '-' || !/\d/.test(value)) return null;

  const isNegative = value.startsWith('-');
  if (isNegative) value = value.slice(1);

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      value = value.replace(/\./g, '').replace(',', '.');
    } else {
      value = value.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    const parts = value.split(',');
    const lastPart = parts[parts.length - 1];
    const isThousands = parts.length > 1
      && parts.slice(1).every((part) => part.length === 3)
      && parts[0].length <= 3;
    value = isThousands || lastPart.length === 3
      ? parts.join('')
      : `${parts.slice(0, -1).join('')}.${lastPart}`;
  } else if (lastDot !== -1) {
    const parts = value.split('.');
    const lastPart = parts[parts.length - 1];
    const isThousands = parts.length > 1
      && parts.slice(1).every((part) => part.length === 3)
      && parts[0].length <= 3;
    if (isThousands) {
      value = parts.join('');
    } else if (parts.length > 2) {
      value = `${parts.slice(0, -1).join('')}.${lastPart}`;
    }
  }

  const parsed = Number(`${isNegative ? '-' : ''}${value}`);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBalanceResponse(response, username) {
  const usernameRegex = new RegExp(escapeRegex(username), 'gi');
  const cleaned = stripMinecraftFormatting(response)
    .replace(usernameRegex, '')
    .replace(/\b(balance|bal|money|has|have|of|is|currently|coins?|xu|vnd|dollars?|wallet)\b/gi, ' ')
    .replace(/[$â‚¬Â£â‚«]/g, ' ')
    .replace(/'/g, ' ')
    .trim();

  const candidates = cleaned.match(/-?\d[\d,.\s]*/g) || [];
  const balances = candidates
    .map((candidate) => normalizeNumericToken(candidate.replace(/\s+/g, '')))
    .filter((value) => value !== null);

  if (balances.length === 0) return 0;
  return balances[balances.length - 1];
}

function parseRankFromBalanceResponse(response, username) {
  const cleanResponse = stripMinecraftFormatting(response);
  return rankService.parseRankFromBalanceResponse(cleanResponse, username);
}

class MinecraftService {
  constructor() {
    this.balanceCache = new Map(); // username -> { balance, timestamp }
    this.CACHE_DURATION = 2 * 1000; // 2 seconds, keeps rank prefix updates responsive
  }

  /**
   * Verify if a player exists on the Minecraft server
   * @param {string} username 
   * @returns {Promise<{exists: boolean, realName: string}>}
   */
  async verifyPlayerExists(username) {
    if (!username) return { exists: false, realName: '' };
    
    console.log(`[MINECRAFT SERVICE] Player verification request: ${username}`);
    
    try {
      // Use EssentialsX 'seen' command as it's reliable for offline players too
      // We use 'essentials:seen' to ensure we call the specific plugin command
      const response = await rconService.sendCommand(`essentials:seen ${username}`);
      
      // Detailed check for failure
      // Common failure messages: "Player not found", "never seen", "Usage:", "Command Help"
      const lowerResponse = response.toLowerCase();
      const isNotFound = lowerResponse.includes('not found') || 
                         lowerResponse.includes('never seen') || 
                         lowerResponse.includes('khÃ´ng tÃ¬m tháº¥y') ||
                         lowerResponse.includes('khÃ´ng tÃ¬m tháº¥y') ||
                         lowerResponse.includes('error:') ||
                         lowerResponse.includes('command help') ||
                         lowerResponse.includes('usage:');

      if (isNotFound) {
        console.log(`[MINECRAFT SERVICE] Verification result for ${username}: false (Response: ${response.trim()})`);
        return { exists: false, realName: '' };
      }

      // Try to extract exact name if possible
      // Essentials often returns "Player: Name" or "Name - Offline"
      const lines = response.split('\n');
      let realName = username;
      
      // Clean up the response to get just the name if it's there
      // Example: "Â§6Slayer Â§f- Â§7OfflineÂ§f"
      const cleanLine = lines[0].replace(/Â§[0-9a-fk-or]/g, '').trim();
      
      if (cleanLine.includes('-')) {
        realName = cleanLine.split('-')[0].trim();
      } else if (cleanLine.includes(':')) {
        realName = cleanLine.split(':')[1].trim();
      } else if (cleanLine.length > 0) {
        // If it's just one word or something sensible, it might be the name
        const firstWord = cleanLine.split(' ')[0];
        if (firstWord.toLowerCase() === username.toLowerCase()) {
          realName = firstWord;
        }
      }

      console.log(`[MINECRAFT SERVICE] Verification result for ${username}: true (Real Name: ${realName})`);
      return { exists: true, realName };
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Verify Player Error:', error.message);
      throw new Error('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n Minecraft Server Ä‘á»ƒ xÃ¡c minh nhÃ¢n váº­t');
    }
  }

  /**
   * Get player balance from Minecraft server
   * @param {string} username 
   * @returns {Promise<number>}
   */
  async getPlayerBalance(username) {
    const profile = await this.getPlayerBalanceProfile(username);
    return profile.balance;
  }

  /**
   * Get player balance and rank prefix from the same Essentials balance response
   * @param {string} username
   * @returns {Promise<{balance: number, rank: string, rankKey: string}>}
   */
  async getPlayerBalanceProfile(username, options = {}) {
    const forceRefresh = Boolean(options.forceRefresh);
    if (!username) {
      return {
        balance: 0,
        ...rankService.resolveStoredRank(),
      };
    }

    // Check cache
    const cached = this.balanceCache.get(username);
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      const cachedRank = rankService.resolveStoredRank(cached.rank);
      return {
        balance: cached.balance,
        rank: cached.rank || cachedRank.rank,
        rankKey: cached.rankKey || cachedRank.rankKey,
      };
    }

    try {
      // Use 'bal' instead of 'eco balance' which is more standard for viewing
      // Prefix with 'essentials:' to be safe
      const command = `essentials:bal ${username}`;
      console.log(`[MINECRAFT SERVICE] Balance command: ${command}${forceRefresh ? ' (force refresh)' : ''}`);
      
      console.log(`[MINECRAFT SERVICE] Before RCON send balance command: ${command}`);
      const response = await rconService.sendCommand(command);
      console.log(`[MINECRAFT SERVICE] After RCON send balance command: ${command}`);
      console.log(`[MINECRAFT SERVICE] Balance response for ${username}: ${response.trim()}`);

      // Check if response is help page or error
      const lowerRes = response.toLowerCase();
      if (lowerRes.includes('help') || lowerRes.includes('usage') || lowerRes.includes('error') || lowerRes.includes('not found')) {
        console.warn(`[MINECRAFT SERVICE] Balance command failed or returned Help/Error for ${username}: ${response.trim()}`);
        // If it explicitly says "not found", we throw a specific error that the controller can catch
        if (lowerRes.includes('not found')) {
          throw new Error('PLAYER_NOT_FOUND');
        }
        if (cached) {
          const cachedRank = rankService.resolveStoredRank(cached.rank);
          return {
            balance: cached.balance,
            rank: cached.rank || cachedRank.rank,
            rankKey: cached.rankKey || cachedRank.rankKey,
          };
        }
        return {
          balance: 0,
          ...rankService.resolveStoredRank(),
        };
      }

      const balance = parseBalanceResponse(response, username);
      const cleanResponse = stripMinecraftFormatting(response).replace(/\s+/g, ' ').trim();
      const parsedRank = parseRankFromBalanceResponse(response, username) || rankService.resolveStoredRank();
      console.log(`[MINECRAFT SERVICE] Parsed balance for ${username}: ${balance} (Clean response: ${cleanResponse})`);
      console.log(`[MINECRAFT SERVICE] Parsed rank prefix for ${username}: ${parsedRank.rawGroup || parsedRank.rankKey} -> ${parsedRank.rank}`);

      // Update cache
      this.balanceCache.set(username, {
        balance,
        rank: parsedRank.rank,
        rankKey: parsedRank.rankKey,
        timestamp: Date.now()
      });

      return {
        balance,
        rank: parsedRank.rank,
        rankKey: parsedRank.rankKey,
      };
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Get Balance Error:', error.message);
      // Propagate critical "not found" error so controller can fail the request
      if (error.message === 'PLAYER_NOT_FOUND') {
        throw error;
      }
      if (cached) {
        const cachedRank = rankService.resolveStoredRank(cached.rank);
        return {
          balance: cached.balance,
          rank: cached.rank || cachedRank.rank,
          rankKey: cached.rankKey || cachedRank.rankKey,
        };
      }
      return {
        balance: 0,
        ...rankService.resolveStoredRank(),
      };
    }
  }

  /**
   * Get player's rank from the prefix included in the balance response
   * @param {string} username
   * @returns {Promise<string>}
   */
  async getPlayerRank(username) {
    if (!username) return 'Member';

    try {
      const rankInfo = await this.getPlayerBalanceProfile(username);
      return rankInfo.rank;
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Get Rank Prefix Error:', error.message);
      return 'Member';
    }

  }

  /**
   * Execute a command on the Minecraft server
   * @param {string} command 
   */
  async executeCommand(command) {
    return await rconService.sendCommand(command);
  }
}

const minecraftService = new MinecraftService();
module.exports = minecraftService;
module.exports.parseRankFromBalanceResponse = parseRankFromBalanceResponse;
module.exports.parseBalanceResponse = parseBalanceResponse;
