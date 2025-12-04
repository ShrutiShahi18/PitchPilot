const { Schema, model, Types } = require('mongoose');

const emailEventSchema = new Schema(
  {
    lead: { type: Types.ObjectId, ref: 'Lead', required: true },
    campaign: { type: Types.ObjectId, ref: 'Campaign', required: true },
    sequenceStep: { type: Types.ObjectId, ref: 'SequenceStep' },
    gmailMessageId: String,
    type: {
      type: String,
      enum: ['sent', 'delivered', 'opened', 'replied', 'followup_due'],
      required: true
    },
    subject: String,
    snippet: String,
    payload: Object,
    occurredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

emailEventSchema.index({ type: 1, occurredAt: -1 });

module.exports = model('EmailEvent', emailEventSchema);


