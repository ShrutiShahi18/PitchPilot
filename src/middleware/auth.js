const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');

// Protect routes - require authentication
async function protect(req, res, next) {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized. Please login.' });
    }

    // Verify token
    if (!config.jwtSecret) {
      logger.error('JWT_SECRET is not configured in auth middleware!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    return res.status(401).json({ error: 'Not authorized. Invalid token.' });
  }
}

module.exports = { protect };

