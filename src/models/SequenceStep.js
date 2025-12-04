const { Schema, model, Types } = require('mongoose');

const sequenceStepSchema = new Schema(
  {
    campaign: { type: Types.ObjectId, ref: 'Campaign', required: true },
    dayOffset: { type: Number, default: 0 },
    channel: { type: String, enum: ['email'], default: 'email' },
    subjectTemplate: String,
    bodyTemplate: String,
    aiTone: { type: String, default: 'friendly' },
    followupType: { type: String, enum: ['nudge', 'value', 'case-study'], default: 'nudge' },
    metadata: Object
  },
  { timestamps: true }
);

sequenceStepSchema.index({ campaign: 1, dayOffset: 1 });

module.exports = model('SequenceStep', sequenceStepSchema);


