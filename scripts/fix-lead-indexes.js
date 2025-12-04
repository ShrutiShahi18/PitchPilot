/**
 * Script to fix Lead collection indexes
 * 
 * This script removes the old unique index on 'email' and ensures
 * only the compound unique index on 'email' + 'user' exists.
 * 
 * Run: node scripts/fix-lead-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/config/env');

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('leads');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check for old 'email_1' unique index
    const oldEmailIndex = indexes.find(idx => 
      idx.name === 'email_1' && 
      Object.keys(idx.key).length === 1 && 
      idx.key.email === 1 &&
      idx.unique === true
    );

    if (oldEmailIndex) {
      console.log('\n⚠ Found old unique index on "email" - this needs to be dropped');
      console.log('Dropping old index...');
      await collection.dropIndex('email_1');
      console.log('✓ Dropped old email_1 index');
    } else {
      console.log('\n✓ No old email_1 index found');
    }

    // Ensure compound index exists
    const compoundIndex = indexes.find(idx => 
      idx.name === 'email_1_user_1' || 
      (idx.key.email === 1 && idx.key.user === 1)
    );

    if (!compoundIndex) {
      console.log('\nCreating compound unique index on email + user...');
      await collection.createIndex(
        { email: 1, user: 1 },
        { unique: true, name: 'email_1_user_1' }
      );
      console.log('✓ Created compound index');
    } else {
      console.log('\n✓ Compound index already exists');
    }

    // Verify final state
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });

    console.log('\n✓ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

fixIndexes();

