const User = require('../models/User');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');
const logger = require('../utils/logger');

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret || 'your-secret-key-change-in-production', {
    expiresIn: '30d'
  });
}

/**
 * Signup - Create new user
 * POST /api/auth/signup
 */
const signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if user already exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

/**
 * Signin - Login user
 * POST /api/auth/signin
 */
const signin = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate token
  const token = generateToken(user._id);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      settings: req.user.settings
    }
  });
});

module.exports = {
  signup,
  signin,
  getMe
};

