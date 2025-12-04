const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    
    // Ensure database name is in the URI
    let mongoUri = config.mongoUri;
    if (mongoUri && !mongoUri.includes('/?') && !mongoUri.match(/\/[^\/\?]+(\?|$)/)) {
      // Add database name if missing
      mongoUri = mongoUri.replace(/\/(\?|$)/, '/pitchpilot$1');
    }
    
    logger.info(`Attempting to connect to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    logger.info(`MongoDB connected successfully`);
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      message: error.message,
      name: error.name,
      code: error.code,
      mongoUri: config.mongoUri ? config.mongoUri.replace(/\/\/.*@/, '//***@') : 'NOT SET'
    });
    
    // Provide helpful error message
    if (error.message.includes('timeout') || error.code === 'ENOTFOUND') {
      logger.error('MongoDB connection timeout. Common fixes:');
      logger.error('1. Check MongoDB Atlas Network Access - add your IP (0.0.0.0/0 for all)');
      logger.error('2. Verify connection string includes database name');
      logger.error('3. Check if MongoDB Atlas cluster is running');
    }
    
    throw error;
  }
}

module.exports = connectDB;


