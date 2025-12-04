const Campaign = require('../models/Campaign');
const SequenceStep = require('../models/SequenceStep');
const catchAsync = require('../utils/catchAsync');

const listCampaigns = catchAsync(async (req, res) => {
  // Only return campaigns for the authenticated user
  const campaigns = await Campaign.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(50);
  res.json(campaigns);
});

const createCampaign = catchAsync(async (req, res) => {
  // Associate with user
  req.body.user = req.user._id;
  req.body.ownerEmail = req.user.email;
  const campaign = await Campaign.create(req.body);
  res.status(201).json(campaign);
});

const getCampaign = catchAsync(async (req, res) => {
  // Only allow accessing campaigns owned by the user
  const campaign = await Campaign.findOne({ _id: req.params.id, user: req.user._id }).populate('leads');
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const steps = await SequenceStep.find({ campaign: campaign._id }).sort({ dayOffset: 1 });
  res.json({ campaign, steps });
});

const updateCampaign = catchAsync(async (req, res) => {
  // Only allow updating campaigns owned by the user
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

module.exports = {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign
};


