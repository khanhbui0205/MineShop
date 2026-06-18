const rconService = require('./rconService');

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMinecraftFormatting(value) {
  return String(value || '')
    .replace(/(?:§|Â§|&)[0-9A-FK-OR]/gi, '')
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
    .replace(/[$€£₫]/g, ' ')
    .replace(/'/g, ' ')
    .trim();

  const candidates = cleaned.match(/-?\d[\d,.\s]*/g) || [];
  const balances = candidates
    .map((candidate) => normalizeNumericToken(candidate.replace(/\s+/g, '')))
    .filter((value) => value !== null);

  if (balances.length === 0) return 0;
  return balances[balances.length - 1];
}

class MinecraftService {
  constructor() {
    this.balanceCache = new Map(); // username -> { balance, timestamp }
    this.CACHE_DURATION = 10 * 1000; // 10 seconds
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
                         lowerResponse.includes('không tìm thấy') ||
                         lowerResponse.includes('không tìm thấy') ||
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
      // Example: "§6Slayer §f- §7Offline§f"
      const cleanLine = lines[0].replace(/§[0-9a-fk-or]/g, '').trim();
      
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
      throw new Error('Không thể kết nối đến Minecraft Server để xác minh nhân vật');
    }
  }

  /**
   * Get player balance from Minecraft server
   * @param {string} username 
   * @returns {Promise<number>}
   */
  async getPlayerBalance(username) {
    if (!username) return 0;

    // Check cache
    const cached = this.balanceCache.get(username);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      return cached.balance;
    }

    try {
      // Use 'bal' instead of 'eco balance' which is more standard for viewing
      // Prefix with 'essentials:' to be safe
      const command = `essentials:bal ${username}`;
      console.log(`[MINECRAFT SERVICE] Balance command: ${command}`);
      
      const response = await rconService.sendCommand(command);
      console.log(`[MINECRAFT SERVICE] Balance response for ${username}: ${response.trim()}`);

      // Check if response is help page or error
      const lowerRes = response.toLowerCase();
      if (lowerRes.includes('help') || lowerRes.includes('usage') || lowerRes.includes('error') || lowerRes.includes('not found')) {
        console.warn(`[MINECRAFT SERVICE] Balance command failed or returned Help/Error for ${username}: ${response.trim()}`);
        // If it explicitly says "not found", we throw a specific error that the controller can catch
        if (lowerRes.includes('not found')) {
          throw new Error('PLAYER_NOT_FOUND');
        }
        return cached ? cached.balance : 0;
      }

      // Example response: "Balance: $1,250.00" or "kingxu2004 has 1,250.00$"
      // Requirement: Avoid picking numbers from the username itself (e.g. kingxu2004)
      let cleaned = response.replace(/§[0-9a-fk-or]/g, '');
      
      const lowerUsername = username.toLowerCase();
      const lowerCleaned = cleaned.toLowerCase();
      
      // If the response contains the username, remove it to prevent numeric parts of the name (like '2004') from being parsed as balance
      const nameIndex = lowerCleaned.indexOf(lowerUsername);
      if (nameIndex !== -1) {
          cleaned = cleaned.substring(0, nameIndex) + cleaned.substring(nameIndex + username.length);
      }

      // Remove thousands separators (commas or periods followed by 3 digits)
      // If the string is "1.250,50" -> we assume , is decimal if it's the last separator
      // Common Essentials format is "$1,250.00"
      
      let finalClean = cleaned.replace(/[$]/g, '').trim();
      
      // If it contains both , and . (e.g. 1,250.00 or 1.250,00)
      if (finalClean.includes(',') && finalClean.includes('.')) {
          const lastComma = finalClean.lastIndexOf(',');
          const lastDot = finalClean.lastIndexOf('.');
          if (lastComma > lastDot) {
              // European: 1.250,00 -> remove dots, replace comma with dot
              finalClean = finalClean.replace(/\./g, '').replace(',', '.');
          } else {
              // US: 1,250.00 -> remove commas
              finalClean = finalClean.replace(/,/g, '');
          }
      } else if (finalClean.includes(',')) {
          // Only commas. If it's like 1,250 -> could be 1250 or 1.25. 
          // Usually in MC it's a thousands separator if followed by 3 digits.
          if (finalClean.match(/,\d{3}/)) {
              finalClean = finalClean.replace(/,/g, '');
          } else {
              // Otherwise treat as decimal
              finalClean = finalClean.replace(',', '.');
          }
      }
      
      // Look for the first number (handles negative values and decimals)
      const match = finalClean.match(/-?\d+(\.\d+)?/);
      
      const balance = match ? parseFloat(match[0]) : 0;
      console.log(`[MINECRAFT SERVICE] Parsed balance for ${username}: ${balance} (Raw response minus name: ${finalClean.trim()})`);

      // Update cache
      this.balanceCache.set(username, {
        balance,
        timestamp: Date.now()
      });

      return balance;
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Get Balance Error:', error.message);
      // Propagate critical "not found" error so controller can fail the request
      if (error.message === 'PLAYER_NOT_FOUND') {
        throw error;
      }
      return cached ? cached.balance : 0;
    }
  }

  /**
   * Get player's primary group (rank) from LuckPerms
   * @param {string} username 
   * @returns {Promise<string>}
   */
  async getPlayerRank(username) {
    if (!username) return 'Member';

    const CACHE_KEY = `rank_${username}`;
    const cached = this.balanceCache.get(CACHE_KEY);
    if (cached && (Date.now() - cached.timestamp < 60 * 1000)) {
      return cached.rank;
    }

    try {
      const command = `lp user ${username} info`;
      console.log(`[MINECRAFT SERVICE] Rank command: ${command}`);
      
      const response = await rconService.sendCommand(command);
      const lines = response.split('\n');
      let rank = 'Member';
      
      for (const line of lines) {
          const cleanLine = line.replace(/§[0-9a-fk-or]/g, '').trim();
          if (cleanLine.toLowerCase().includes('primary group:')) {
              rank = cleanLine.split(':')[1].trim();
              break;
          }
      }
      
      // Simple formatting: member -> Member
      rank = rank.charAt(0).toUpperCase() + rank.slice(1);
      
      console.log(`[MINECRAFT SERVICE] Parsed rank for ${username}: ${rank}`);

      this.balanceCache.set(CACHE_KEY, {
        rank,
        timestamp: Date.now()
      });

      return rank;
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Get Rank Error:', error.message);
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

module.exports = new MinecraftService();
