const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Transaction = require('../models/Transaction');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrateTransactions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/minecraft_shop');
    console.log('Connected to MongoDB...');

    const transactions = await Transaction.find({});
    let count = 0;

    for (const tx of transactions) {
      if (typeof tx.amount === 'string') {
        // Try to parse number from string like "+50.000 VNĐ" or "+50.000 Xu"
        const cleanAmount = tx.amount.replace(/[^0-9]/g, '');
        const numAmount = parseInt(cleanAmount) || 0;
        
        // If it was "Xu", maybe it should be 0 revenue if it's not real money.
        // But for now let's just convert it to number.
        tx.amount = numAmount;
        await tx.save();
        count++;
      }
    }

    console.log(`Updated ${count} transactions.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateTransactions();
