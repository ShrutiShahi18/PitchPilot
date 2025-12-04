const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    
    // Check if MONGO_URI is set
    if (!config.mongoUri || !config.mongoUri.trim()) {
      const error = new Error('MONGO_URI is not set in environment variables');
      logger.error('MongoDB connection failed: MONGO_URI not configured');
      throw error;
    }
    
    // Ensure database name is in the URI
    let mongoUri = config.mongoUri.trim();
    if (mongoUri && !mongoUri.includes('/?') && !mongoUri.match(/\/[^\/\?]+(\?|$)/)) {
      // Add database name if missing
      mongoUri = mongoUri.replace(/\/(\?|$)/, '/pitchpilot$1');
    }
    
    logger.info(`Attempting to connect to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout for Render
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    
    logger.info(`MongoDB connected successfully`);
    
    // Log connection status
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
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
      logger.error('1. Check MongoDB Atlas Network Access - add 0.0.0.0/0 (allows all IPs)');
      logger.error('2. Verify connection string includes database name');
      logger.error('3. Check if MongoDB Atlas cluster is running (not paused)');
      logger.error('4. Verify MONGO_URI format: mongodb+srv://user:pass@cluster.mongodb.net/pitchpilot?retryWrites=true&w=majority');
    }
    
    if (error.message.includes('authentication failed') || error.code === 8000) {
      logger.error('MongoDB authentication failed. Check:');
      logger.error('1. Username and password in MONGO_URI are correct');
      logger.error('2. Database user has proper permissions');
    }
    
    throw error;
  }
}

module.exports = connectDB;


