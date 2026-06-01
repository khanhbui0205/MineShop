const rconService = require('../services/rconService');

// @desc    Check if player exists on Minecraft server
// @route   POST /api/minecraft/check-player
// @access  Private
exports.checkPlayer = async (req, res) => {
  try {
    const { playerName } = req.body;

    if (!playerName) {
      return res.status(400).json({ message: 'Vui lòng nhập tên người chơi' });
    }

    // Attempt to check player existence via RCON
    // We try multiple common commands to see if the player is known to the server
    // 1. 'list' - Check if currently online (simplest check)
    // 2. 'lp user {player} info' - LuckPerms check (very common)
    // 3. 'seen {player}' - Essentials check (very common)

    try {
      const response = await rconService.sendCommand(`lp user ${playerName} info`);
      
      // If LuckPerms returns info, player exists
      if (response && !response.toLowerCase().includes('user not found') && !response.toLowerCase().includes('could not find')) {
        return res.json({ exists: true, method: 'LuckPerms' });
      }

      // Fallback: Check 'list' for online players
      const listRes = await rconService.sendCommand('list');
      if (listRes && listRes.includes(playerName)) {
        return res.json({ exists: true, method: 'List' });
      }

      // Fallback: Essentials 'seen'
      const seenRes = await rconService.sendCommand(`seen ${playerName}`);
      if (seenRes && !seenRes.toLowerCase().includes('not found') && !seenRes.toLowerCase().includes('never')) {
        return res.json({ exists: true, method: 'Essentials' });
      }
      
      // If we are here, we might not have found them, but let's be careful.
      // Some servers might not have these plugins. 
      // If 'list' contains names and this name isn't there, they aren't online.
      // If LuckPerms is missing, it returns "Unknown command".
      
      if (response && response.toLowerCase().includes('unknown command')) {
         // If plugins are missing, we might just have to trust 'list' or allow it if we can't verify.
         // But for now, let's assume if they aren't online and LuckPerms doesn't know them, they might not exist.
         // However, many servers just want to ensure the name is valid.
         return res.json({ exists: false });
      }

      return res.json({ exists: false });
    } catch (rconError) {
      console.error('RCON Error during player check:', rconError.message);
      // If RCON is down, we might want to fail the check or allow it with a warning.
      // Given the requirement "Không cho thanh toán nếu player không tồn tại", 
      // if RCON is down, we can't verify.
      return res.status(500).json({ 
        message: 'Không thể kết nối tới server Minecraft để kiểm tra người chơi',
        error: rconError.message 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
