// src/index.js
'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const config = require('./config/env'); // your existing env loader
const logger = require('./utils/logger'); // preserve your logger usage if exists
const mongoose = require('mongoose');

// Log env status at startup (for debugging)
logger.info('Environment check', {
  hasGeminiKey: !!config.geminiApiKey,
  geminiKeyLength: config.geminiApiKey?.length || 0,
  hasGmailSender: !!config.gmail.sender,
  gmailSender: config.gmail.sender || 'NOT SET',
  aiProvider: config.aiProvider
});

// Create Express app
const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Basic middleware
app.use(bodyParser.json({ limit: '10mb' })); // Increased for file uploads
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Mount API routes ---
const routes = require('./routes');
app.use('/api', routes);

// --- Static files (optional) ---
// app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// --- Health check ---
app.get('/_health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const dbReadyState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  
  res.json({ 
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    env: config.nodeEnv,
    database: dbStatus,
    databaseReadyState: dbReadyState,
    timestamp: new Date().toISOString(),
    message: dbStatus === 'connected' 
      ? 'Server and database are operational' 
      : 'Server running but database not connected'
  });
});

// --- Debug endpoint to check env vars (remove in production) ---
app.get('/_debug/env', (req, res) => {
  res.json({
    hasGeminiKey: !!config.geminiApiKey,
    geminiKeyLength: config.geminiApiKey?.length || 0,
    geminiKeyPreview: config.geminiApiKey ? config.geminiApiKey.substring(0, 10) + '...' : 'NOT SET',
    hasGmailSender: !!config.gmail.sender,
    gmailSender: config.gmail.sender || 'NOT SET',
    aiProvider: config.aiProvider,
    nodeEnv: config.nodeEnv
  });
});

// --- Global error handler (must be mounted after routes) ---
try {
  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);
} catch (e) {
  // If middleware not present, continue — but log warning
  logger && logger.warn && logger.warn('errorHandler middleware not found or failed to load', e.message);
}

// --- Connect DB and start server ---
const connectDB = require('./config/db');
const { scheduleFollowUpChecks } = require('./services/followupService');

async function start() {
  try {
    await connectDB();
    logger.info('Database connected successfully');
    scheduleFollowUpChecks();
  } catch (error) {
    logger.error('Database connection failed', {
      message: error.message,
      code: error.code
    });
    
    // In production, exit if DB connection fails
    if (config.nodeEnv === 'production') {
      logger.error('Exiting due to database connection failure in production');
      process.exit(1);
    } else {
      logger.warn('Continuing without database (development mode)');
    }
  }
  
  const port = config.port || 4000;
  const host = process.env.HOST || '0.0.0.0'; // Render requires 0.0.0.0
  app.listen(port, host, () => {
    console.log(`PitchPilot backend listening on ${host}:${port} (env=${config.nodeEnv})`);
    logger.info(`Server started on ${host}:${port}`, {
      nodeEnv: config.nodeEnv,
      mongoConnected: mongoose.connection.readyState === 1
    });
  });
}

start();

// Export for testing if needed
module.exports = app;
