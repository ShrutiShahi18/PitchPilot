// src/middleware/errorHandler.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Log full error for debugging
  logger.error('Error handler caught:', {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Check MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    logger.error('MongoDB not connected!', { readyState: mongoose.connection.readyState });
    return res.status(500).json({ 
      error: 'Database connection error',
      message: 'Unable to connect to database. Please check server logs.'
    });
  }

  // Handle specific error types
  if (err && err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate key error',
      message: 'A record with this value already exists',
      keyValue: err.keyValue 
    });
  }

  if (err && err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      error: 'Validation error',
      message: messages.join(', ')
    });
  }

  if (err && err.message && err.message.includes('GMAIL_SENDER')) {
    return res.status(500).json({ 
      error: 'Configuration error',
      message: err.message 
    });
  }

  if (err && err.message && (err.message.includes('access token') || err.message.includes('client not configured') || err.message.includes('Failed to'))) {
    return res.status(500).json({ 
      error: 'Service error',
      message: err.message 
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({ 
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred. Please try again later.' 
      : message
  });
}

module.exports = errorHandler;
  