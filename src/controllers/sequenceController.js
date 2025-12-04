const SequenceStep = require('../models/SequenceStep');
const EmailEvent = require('../models/EmailEvent');
const catchAsync = require('../utils/catchAsync');

const listSteps = catchAsync(async (req, res) => {
  const steps = await SequenceStep.find({ campaign: req.params.campaignId }).sort({ dayOffset: 1 });
  res.json(steps);
});

const createStep = catchAsync(async (req, res) => {
  const step = await SequenceStep.create({ ...req.body, campaign: req.params.campaignId });
  res.status(201).json(step);
});

const scheduleFollowUp = catchAsync(async (req, res) => {
  const { leadId, sendAt } = req.body;
  await EmailEvent.create({
    lead: leadId,
    campaign: req.params.campaignId,
    sequenceStep: req.params.stepId,
    type: 'followup_due',
    occurredAt: new Date(sendAt)
  });
  res.json({ success: true });
});

module.exports = {
  listSteps,
  createStep,
  scheduleFollowUp
};


