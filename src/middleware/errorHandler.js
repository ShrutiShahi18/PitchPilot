// src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
    console.error(err);
  
    if (err && err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error', keyValue: err.keyValue });
    }
  
    if (err && err.message && err.message.includes('GMAIL_SENDER')) {
      return res.status(500).json({ message: err.message });
    }
  
    if (err && err.message && (err.message.includes('access token') || err.message.includes('client not configured') || err.message.includes('Failed to'))) {
      return res.status(500).json({ message: err.message });
    }
  
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  }
  
  module.exports = errorHandler;
  