const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/minecraft_shop');
    console.log('Connected to MongoDB...');

    // 1. Update all users with empty string minecraftUsername to null
    const result = await User.updateMany(
      { minecraftUsername: "" },
      { $set: { minecraftUsername: null } }
    );
    console.log(`Updated ${result.modifiedCount} users with empty minecraftUsername to null.`);

    // 2. Drop the old index if it exists (minecraftUsername_1)
    try {
      await User.collection.dropIndex('minecraftUsername_1');
      console.log('Dropped old index minecraftUsername_1');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('Old index minecraftUsername_1 not found, skipping drop.');
      } else {
        console.error('Error dropping index:', err.message);
      }
    }

    // 3. Re-create the index (Mongoose will do this normally upon first access, but we can force it)
    console.log('Creating new partial index...');
    await User.collection.createIndex(
      { minecraftUsername: 1 },
      { 
        unique: true, 
        partialFilterExpression: { minecraftUsername: { $type: 'string', $gt: '' } } 
      }
    );
    console.log('New partial index created successfully.');

    console.log('Migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
