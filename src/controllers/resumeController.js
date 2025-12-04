const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Upload resume
 * POST /api/resume/upload
 */
const uploadResume = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const user = await User.findById(req.user._id);
  
  // Delete old resume if exists
  if (user.resume && user.resume.path) {
    const oldPath = path.join(__dirname, '..', '..', user.resume.path);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // Update user with new resume info
  user.resume = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: path.relative(path.join(__dirname, '..', '..'), req.file.path),
    uploadedAt: new Date()
  };

  await user.save();

  res.json({
    message: 'Resume uploaded successfully',
    resume: {
      filename: user.resume.filename,
      originalName: user.resume.originalName,
      uploadedAt: user.resume.uploadedAt
    }
  });
});

/**
 * Get current user's resume info
 * GET /api/resume
 */
const getResume = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.resume || !user.resume.path) {
    return res.status(404).json({ error: 'No resume uploaded' });
  }

  res.json({
    resume: {
      filename: user.resume.filename,
      originalName: user.resume.originalName,
      uploadedAt: user.resume.uploadedAt
    }
  });
});

/**
 * Download resume file
 * GET /api/resume/download
 */
const downloadResume = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.resume || !user.resume.path) {
    return res.status(404).json({ error: 'No resume uploaded' });
  }

  const filePath = path.join(__dirname, '..', '..', user.resume.path);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Resume file not found' });
  }

  res.download(filePath, user.resume.originalName, (err) => {
    if (err) {
      logger.error('Error downloading resume', { error: err.message });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading resume' });
      }
    }
  });
});

/**
 * Delete resume
 * DELETE /api/resume
 */
const deleteResume = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.resume || !user.resume.path) {
    return res.status(404).json({ error: 'No resume uploaded' });
  }

  const filePath = path.join(__dirname, '..', '..', user.resume.path);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  user.resume = undefined;
  await user.save();

  res.json({ message: 'Resume deleted successfully' });
});

module.exports = {
  uploadResume,
  getResume,
  downloadResume,
  deleteResume
};

