// src/index.js
'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const config = require('./config/env'); // your existing env loader
const logger = require('./utils/logger'); // preserve your logger usage if exists

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

// Basic middleware
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // optional; remove if you don't use morgan

// --- Mount API routes ---
const routes = require('./routes');
app.use('/api', routes);

// --- Static files (optional) ---
// app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// --- Health check ---
app.get('/_health', (req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

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
    scheduleFollowUpChecks();
  } catch (error) {
    logger.error('Database connection failed, but continuing anyway (some features may not work)', {
      message: error.message
    });
    // Don't exit - allow server to start even without DB for development
    // In production, you might want to exit here
  }
  
  const port = config.port || 4000;
  app.listen(port, () => {
    console.log(`PitchPilot backend listening on port ${port} (env=${config.nodeEnv})`);
    logger && logger.info && logger.info(`Server started on port ${port}`);
  });
}

start();

// Export for testing if needed
module.exports = app;
