const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false }, // Don't return password by default
    gmailCredentials: {
      clientId: String,
      clientSecret: String,
      refreshToken: String,
      sender: String
    },
    aiProvider: { type: String, default: 'gemini' },
    aiApiKey: String, // User's own AI API key
    resume: {
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: Date
    },
    settings: {
      autoSyncReplies: { type: Boolean, default: true },
      syncInterval: { type: Number, default: 15 } // minutes
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Note: email field already has unique: true in schema, which automatically creates an index
// No need for explicit index() call here

module.exports = model('User', userSchema);

