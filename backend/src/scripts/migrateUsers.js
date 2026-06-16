const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/minecraft_shop');
    console.log('Connected to MongoDB...');

    // 1. Normalize empty minecraftUsername values
    const emptyResult = await User.updateMany(
      { $or: [{ minecraftUsername: '' }, { minecraftUsername: null }] },
      { $set: { minecraftUsername: null, minecraftVerified: false } }
    );
    console.log(`Normalized ${emptyResult.modifiedCount} users with empty minecraftUsername.`);

    // 2. Backfill legacy users: copy portal username when MC username is missing
    const legacyUsers = await User.find({
      $or: [{ minecraftUsername: null }, { minecraftUsername: { $exists: false } }],
      username: { $exists: true, $ne: '' },
    });

    let backfilled = 0;
    for (const user of legacyUsers) {
      const duplicate = await User.findOne({
        _id: { $ne: user._id },
        minecraftUsername: { $regex: new RegExp(`^${user.username}$`, 'i') },
      });
      if (duplicate) {
        console.warn(`Skipping user ${user.email}: username "${user.username}" already taken as minecraftUsername.`);
        continue;
      }
      user.minecraftUsername = user.username;
      user.minecraftVerified = true;
      await user.save();
      backfilled += 1;
    }
    console.log(`Backfilled minecraftUsername for ${backfilled} legacy users.`);

    // 3. Ensure verified flag for all users with a minecraftUsername
    const verifiedResult = await User.updateMany(
      { minecraftUsername: { $type: 'string', $gt: '' } },
      { $set: { minecraftVerified: true } }
    );
    console.log(`Marked ${verifiedResult.modifiedCount} users as minecraftVerified.`);

    // 4. Recreate partial unique index
    try {
      await User.collection.dropIndex('minecraftUsername_1');
      console.log('Dropped old index minecraftUsername_1');
    } catch (err) {
      if (err.codeName !== 'IndexNotFound') {
        console.error('Error dropping index:', err.message);
      }
    }

    await User.collection.createIndex(
      { minecraftUsername: 1 },
      {
        unique: true,
        partialFilterExpression: { minecraftUsername: { $type: 'string', $gt: '' } },
      }
    );
    console.log('Partial unique index on minecraftUsername created.');

    const remaining = await User.countDocuments({
      $or: [{ minecraftUsername: null }, { minecraftUsername: '' }],
    });
    if (remaining > 0) {
      console.warn(`${remaining} user(s) still missing minecraftUsername — manual review required.`);
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
