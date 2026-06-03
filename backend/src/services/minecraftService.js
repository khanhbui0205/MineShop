const rconService = require('./rconService');

class MinecraftService {
  constructor() {
    this.balanceCache = new Map(); // username -> { balance, timestamp }
    this.CACHE_DURATION = 30 * 1000; // 30 seconds
  }

  /**
   * Verify if a player exists on the Minecraft server
   * @param {string} username 
   * @returns {Promise<{exists: boolean, realName: string}>}
   */
  async verifyPlayerExists(username) {
    try {
      // Use EssentialsX 'seen' command as it's reliable for offline players too
      const response = await rconService.sendCommand(`essentials:seen ${username}`);
      
      // If response contains "not found", they don't exist
      if (response.toLowerCase().includes('not found') || response.toLowerCase().includes('never seen')) {
        return { exists: false, realName: '' };
      }

      // Try to extract exact name if possible, otherwise return input
      // Essentials often returns "Player: Name" or similar
      const lines = response.split('\n');
      let realName = username;
      
      // Some 'seen' outputs: "Slayer - Offline" or "Player: Slayer"
      if (lines[0] && lines[0].includes('-')) {
        realName = lines[0].split('-')[0].trim();
      } else if (lines[0] && lines[0].includes(':')) {
          realName = lines[0].split(':')[1].trim();
      }

      // Check if the response actually looks like a success
      // If it's just repeating the command or generic error, we might need a better check
      return { exists: true, realName };
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Verify Player Error:', error.message);
      // Fallback: if RCON is down, we might want to warn
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
      console.log(`[MINECRAFT SERVICE] Returning cached balance for ${username}: ${cached.balance}`);
      return cached.balance;
    }

    try {
      // Common economy command: /eco balance <user>
      const response = await rconService.sendCommand(`eco balance ${username}`);
      console.log(`[MINECRAFT SERVICE] Balance response for ${username}:`, response);

      // Example response: "Balance: $1,250.00" or "kingxu2004 has 1,250.00$"
      // Remove symbols and commas, extract numbers
      const cleaned = response.replace(/[$,]/g, '');
      const match = cleaned.match(/(\d+(\.\d+)?)/);
      
      const balance = match ? parseFloat(match[0]) : 0;

      // Update cache
      this.balanceCache.set(username, {
        balance,
        timestamp: Date.now()
      });

      return balance;
    } catch (error) {
      console.error('[MINECRAFT SERVICE] Get Balance Error:', error.message);
      // If error, return cached if exists, else 0
      return cached ? cached.balance : 0;
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
