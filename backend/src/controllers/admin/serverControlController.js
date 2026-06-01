const rconService = require('../../services/rconService');
const ServerCommandHistory = require('../../models/ServerCommandHistory');

// @desc    Execute a command on the Minecraft server
// @route   POST /api/admin/server-control/execute
// @access  Private/Admin
exports.executeCommand = async (req, res) => {
  try {
    const { command } = req.body;

    if (!command || !command.trim()) {
      return res.status(400).json({ message: 'Lệnh không được để trống' });
    }

    const trimmedCommand = command.trim();
    let success = true;
    let responseText = '';

    try {
      responseText = await rconService.sendCommand(trimmedCommand);
    } catch (error) {
      success = false;
      responseText = error.message;
    }

    // Save to history
    await ServerCommandHistory.create({
      adminId: req.user._id,
      command: trimmedCommand,
      response: responseText,
      success,
    });

    res.json({
      success,
      response: responseText,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get server connection status
// @route   GET /api/admin/server-control/status
// @access  Private/Admin
exports.getServerStatus = async (req, res) => {
  try {
    const status = await rconService.checkStatus();
    res.json({
      ...status,
      host: process.env.RCON_HOST,
      port: process.env.RCON_PORT,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get command history
// @route   GET /api/admin/server-control/history
// @access  Private/Admin
exports.getCommandHistory = async (req, res) => {
  try {
    const history = await ServerCommandHistory.find()
      .populate('adminId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
