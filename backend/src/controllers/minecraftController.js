const rconService = require('../services/rconService');

// @desc    Check if player exists on Minecraft server
// @route   POST /api/minecraft/check-player or GET /api/minecraft/check-player/:username
// @access  Private
exports.checkPlayer = async (req, res) => {
  try {
    const playerName = req.body.playerName || req.params.username;

    if (!playerName) {
      return res.status(400).json({ message: 'Vui lòng nhập tên người chơi' });
    }

    // Attempt to check player existence via RCON
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
      
      if (response && response.toLowerCase().includes('unknown command')) {
         return res.json({ exists: false });
      }

      return res.json({ exists: false });
    } catch (rconError) {
      console.error('RCON Error during player check:', rconError.message);
      return res.status(500).json({ 
        message: 'Không thể kết nối tới server Minecraft để kiểm tra người chơi',
        error: rconError.message 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify player for order creation
// @route   POST /api/minecraft/verify-player
// @access  Private
exports.verifyPlayer = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên nhân vật' });
    }

    try {
      // Logic tương tự checkPlayer nhưng trả về lỗi nếu không tồn tại
      const response = await rconService.sendCommand(`lp user ${username} info`);
      
      let exists = false;
      if (response && !response.toLowerCase().includes('user not found') && !response.toLowerCase().includes('could not find')) {
        exists = true;
      }

      if (!exists) {
        const listRes = await rconService.sendCommand('list');
        if (listRes && listRes.includes(username)) {
          exists = true;
        }
      }

      if (!exists) {
        const seenRes = await rconService.sendCommand(`seen ${username}`);
        if (seenRes && !seenRes.toLowerCase().includes('not found') && !seenRes.toLowerCase().includes('never')) {
          exists = true;
        }
      }

      if (exists) {
        return res.json({ success: true, message: 'Người chơi hợp lệ' });
      } else {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người chơi trên máy chủ.' });
      }
    } catch (rconError) {
      console.error('RCON Error during verify:', rconError.message);
      return res.status(500).json({ message: 'Không thể kết nối tới server Minecraft' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
