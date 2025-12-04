const { Schema, model, Types } = require('mongoose');

const campaignSchema = new Schema(
  {
    title: { type: String, required: true },
    jobDescription: { type: String, required: true },
    productPitch: { type: String, required: true },
    tone: { type: String, default: 'friendly' },
    targetRole: { type: String, default: 'HR' },
    ownerEmail: { type: String, required: true },
    user: { type: Types.ObjectId, ref: 'User', required: true },
    leads: [{ type: Types.ObjectId, ref: 'Lead' }],
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft'
    },
    metadata: Object
  },
  { timestamps: true }
);

module.exports = model('Campaign', campaignSchema);


