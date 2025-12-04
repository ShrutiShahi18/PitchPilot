// src/controllers/leadController.js
const Lead = require('../models/Lead');
const catchAsync = require('../utils/catchAsync');

const listLeads = catchAsync(async (req, res) => {
  // Only return leads for the authenticated user
  const leads = await Lead.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(100);
  res.json(leads);
});

const createLead = catchAsync(async (req, res, next) => {
  if (req.body && req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }

  // Associate with user
  req.body.user = req.user._id;

  // Use findOneAndUpdate with upsert for atomic operation (prevents race conditions)
  const email = req.body.email;
  const userId = req.user._id;

  // Prepare update object - only update fields that are provided
  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.role !== undefined) updateData.role = req.body.role;
  if (req.body.company !== undefined) updateData.company = req.body.company;
  if (req.body.linkedinUrl !== undefined) updateData.linkedinUrl = req.body.linkedinUrl;
  if (req.body.jdSnapshot !== undefined) updateData.jdSnapshot = req.body.jdSnapshot;
  if (req.body.personalizationNotes !== undefined) updateData.personalizationNotes = req.body.personalizationNotes;

  try {
    // Use upsert to either update existing or create new (atomic operation)
    const lead = await Lead.findOneAndUpdate(
      { email, user: userId },
      { 
        $set: updateData,
        $setOnInsert: { // Only set these on insert (creation)
          email,
          user: userId,
          status: 'new'
        }
      },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true // Run schema validators
      }
    );

    // Always return 200 for upsert operations (frontend handles both 200 and 201 the same)
    return res.status(200).json(lead);
  } catch (err) {
    // Handle duplicate key error (can happen if old index exists on just 'email')
    if (err.name === 'MongoServerError' && err.code === 11000) {
      // Try to find existing lead by email and user
      const existing = await Lead.findOne({ email, user: userId });
      if (existing) {
        // Update existing lead with new data
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined) {
            existing[key] = updateData[key];
          }
        });
        await existing.save();
        return res.status(200).json(existing);
      }
      
      // If we can't find it, there might be a lead with same email but different user
      // (from old index). Try to find any lead with this email for this user
      const anyLead = await Lead.findOne({ email });
      if (anyLead && anyLead.user.toString() === userId.toString()) {
        // Update it
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined) {
            anyLead[key] = updateData[key];
          }
        });
        await anyLead.save();
        return res.status(200).json(anyLead);
      }
      
      // If still not found, return error
      return res.status(409).json({ 
        error: 'Duplicate email',
        message: 'A lead with this email already exists'
      });
    }
    // Re-throw other errors
    next(err);
  }
});

const updateLead = catchAsync(async (req, res) => {
  // Only allow updating leads owned by the user
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

const deleteLead = catchAsync(async (req, res) => {
  // Only allow deleting leads owned by the user
  const lead = await Lead.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.status(204).send();
});

module.exports = {
  listLeads,
  createLead,
  updateLead,
  deleteLead
};
