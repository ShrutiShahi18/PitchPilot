const { Schema, model } = require('mongoose');

const leadSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: String,
    company: String,
    linkedinUrl: String,
    jdSnapshot: String,
    personalizationNotes: String,
    status: {
      type: String,
      enum: ['new', 'contacted', 'replied', 'qualified', 'closed'],
      default: 'new'
    },
    lastContactedAt: Date,
    lastRepliedAt: Date,
    owner: String,
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    metadata: Object
  },
  { timestamps: true }
);

leadSchema.index({ email: 1, user: 1 }, { unique: true });

module.exports = model('Lead', leadSchema);


