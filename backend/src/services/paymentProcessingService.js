const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Package = require('../models/Package');
const PackageExecutionLog = require('../models/PackageExecutionLog');
const rconService = require('./rconService');

/**
 * Process a successful payment: update balance and execute Minecraft commands
 * @param {Object} transaction - The transaction document
 * @returns {Promise<boolean>} - Success status
 */
async function processSuccessfulPayment(transaction) {
  // 1. Mark as completed in DB (Idempotency check)
  if (transaction.status === 'completed' || transaction.status === 'paid') {
    return false; 
  }
  
  console.log(`[PAYMENT SERVICE] Processing successful payment for Order: ${transaction.orderCode}`);
  
  transaction.status = 'completed';
  transaction.paidAt = new Date();
  await transaction.save();

  // 2. Update User Balance
  const user = await User.findById(transaction.user._id || transaction.user);
  if (user) {
    user.balance += transaction.coinsChange;
    user.totalDeposited += Number(transaction.amount) || 0;
    await user.save();
    console.log(`[PAYMENT SERVICE] Updated User ${user.username} balance. +${transaction.coinsChange} coins.`);
  }

  // 3. Execute Minecraft Package Commands
  if (transaction.package && transaction.playerName && !transaction.rewardDelivered) {
    const pkg = await Package.findById(transaction.package);
    if (pkg && pkg.commands && pkg.commands.length > 0) {
      console.log(`[RCON SERVICE] Delivering package ${pkg.name} to ${transaction.playerName}`);
      
      let allSuccess = true;
      for (const cmdTemplate of pkg.commands) {
        const command = cmdTemplate.replace(/{player}/g, transaction.playerName);
        try {
          const response = await rconService.sendCommand(command);
          await PackageExecutionLog.create({
            paymentId: transaction._id,
            packageId: pkg._id,
            playerName: transaction.playerName,
            command: command,
            success: true,
            response: response || 'Success'
          });
        } catch (error) {
          allSuccess = false;
          console.error(`[RCON SERVICE] Error executing ${command}:`, error.message);
          await PackageExecutionLog.create({
            paymentId: transaction._id,
            packageId: pkg._id,
            playerName: transaction.playerName,
            command: command,
            success: false,
            response: error.message
          });
        }
      }
      
      if (allSuccess) {
        transaction.rewardDelivered = true;
        await transaction.save();
        console.log(`[RCON SERVICE] All commands executed successfully for ${transaction.orderCode}`);
      }
    }
  }

  return true;
}

module.exports = {
  processSuccessfulPayment
};
