const dotenv = require('dotenv');
const path = require('path');

// Only load .env file in development (not in production where env vars come from Render)
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'development') {
  // Load .env from project root (explicit path)
  const envPath = path.resolve(__dirname, '..', '..', '.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    // Only warn in development - in production, env vars come from Render
    console.warn('Warning: .env file not found or error loading:', result.error.message);
    console.warn('This is normal if you haven\'t created a .env file yet.');
  } else {
    console.log(`✓ Loaded .env from: ${envPath}`);
    console.log(`✓ Found ${Object.keys(result.parsed || {}).length} environment variables`);
  }
} else {
  // In production, environment variables come from Render dashboard
  // No need to load .env file
  console.log('✓ Running in production mode - using environment variables from Render');
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pitchpilot',
  jwtSecret: process.env.JWT_SECRET || 'pitchpilot-secret-key-change-in-production',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiProvider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    sender: process.env.GMAIL_SENDER || ''
  }
};

module.exports = config;


