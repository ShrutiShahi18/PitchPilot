// src/services/aiService.js
/**
 * Gemini-backed AI service (strict JSON output, tone-aware)
 *
 * - Uses @google/generative-ai when GEMINI_API_KEY is present.
 * - Requests strict JSON: {"bullets":[...], "subject":"...", "body":"..."}
 * - Accepts `tone` and `temperature` params.
 * - Falls back to a safe template on error.
 *
 * Install: npm install @google/generative-ai
 */

const config = require('../config/env');
const logger = require('../utils/logger');

// Gemini client init (robust)
let geminiClient = null;
// Try different model names - free tier typically uses these
let geminiModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

// Debug: Log what we see at module load time
logger.info('aiService module loaded', {
  hasConfigKey: !!config.geminiApiKey,
  configKeyLength: config.geminiApiKey?.length || 0,
  hasProcessEnv: !!process.env.GEMINI_API_KEY,
  processEnvLength: process.env.GEMINI_API_KEY?.length || 0
});

// Function to list available models
async function listAvailableModels() {
  if (!config.geminiApiKey) return [];
  
  try {
    const axios = require('axios');
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const models = response.data.models || [];
    const modelNames = models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
    
    logger.info('Available Gemini models', { models: modelNames, count: modelNames.length });
    return modelNames;
  } catch (error) {
    logger.warn('Failed to list available models', { error: error.message });
    return [];
  }
}

if (config.geminiApiKey && config.geminiApiKey.trim()) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    geminiClient = new GoogleGenerativeAI(config.geminiApiKey.trim());
    logger.info('Gemini SDK loaded successfully');
    
    // List available models on startup
    listAvailableModels().then(models => {
      if (models.length > 0) {
        logger.info(`Found ${models.length} available models. Will use: ${models[0]}`);
        geminiModelName = models[0]; // Use first available model
      }
    });
  } catch (err) {
    logger.warn('Failed to require @google/generative-ai - Gemini unavailable:', err.message);
    geminiClient = null;
  }
} else {
  logger.info('GEMINI_API_KEY not found or empty — Gemini client not configured');
  geminiClient = null;
}

// Try REST API directly as fallback
async function callGeminiREST(prompt, modelName, temperature, apiKey = null) {
  const key = apiKey || config.geminiApiKey;
  const axios = require('axios');
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
    {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: temperature || 0.7
      }
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.candidates[0].content.parts[0].text;
}

// callGemini: use correct SDK pattern with fallback models
async function callGemini(prompt, opts = {}) {
  const apiKey = opts.apiKey || config.geminiApiKey;
  if (!apiKey || !apiKey.trim()) throw new Error('Gemini API key not configured');
  
  // Create client with user's API key if provided
  let client = geminiClient;
  if (opts.apiKey && opts.apiKey !== config.geminiApiKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      client = new GoogleGenerativeAI(apiKey.trim());
    } catch (err) {
      logger.warn('Failed to create Gemini client with user API key', err.message);
      throw new Error('Invalid Gemini API key');
    }
  }
  
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.7;

  // First, try to get available models if we haven't already
  let availableModels = [];
  try {
    availableModels = await listAvailableModels();
  } catch (e) {
    // Continue with fallback list
  }

  // Build model list: available models first, then fallbacks
  const modelNamesToTry = [
    ...(availableModels.length > 0 ? availableModels : []),
    opts.model || geminiModelName,
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro'
  ].filter((v, i, a) => a.indexOf(v) === i && v); // Remove duplicates and empty values

  let lastError = null;
  
  // First try SDK approach
  for (const modelName of modelNamesToTry) {
    try {
      const model = client.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature }
      });
      
      logger.info('Calling Gemini API (SDK)', { model: modelName, promptLength: prompt.length });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info('Gemini API success', { model: modelName, responseLength: text.length });
      return text;
    } catch (error) {
      lastError = error;
      logger.warn(`Model ${modelName} failed (SDK), trying REST...`, { error: error.message });
      
      // Try REST API as fallback
      try {
        logger.info('Trying REST API', { model: modelName });
        const text = await callGeminiREST(prompt, modelName, temperature, apiKey);
        logger.info('Gemini REST API success', { model: modelName, responseLength: text.length });
        return text;
      } catch (restError) {
        logger.warn(`REST API also failed for ${modelName}`, { error: restError.message });
        continue; // Try next model
      }
    }
  }
  
  // All models failed
  logger.error('All Gemini models failed', { 
    error: lastError?.message, 
    modelsTried: modelNamesToTry
  });
  throw lastError || new Error('All Gemini model attempts failed');
}

// Build prompt for email generation
function buildPrompt({ lead, jobDescriptionOverride, productPitch, tone = 'professional' }) {
  const jd = jobDescriptionOverride || lead?.jdSnapshot || 'Not provided';
  const candidateBackground = productPitch || 'Not provided';
  
  return `You are a job seeker writing a personalized email to a recruiter about a job opportunity.

JOB DESCRIPTION:
${jd}

YOUR BACKGROUND & SKILLS:
${candidateBackground}

RECRUITER DETAILS:
- Name: ${lead?.name || 'N/A'}
- Role: ${lead?.role || 'N/A'}
- Company: ${lead?.company || 'N/A'}

INSTRUCTIONS:
- Tone: ${tone} and professional
- Make it concise (150 words max)
- Show genuine interest in the role and company
- Highlight 2-3 specific skills/experiences that match the JD requirements
- Subject line should be clear and professional (e.g., "Application for [Role] - [Your Name]")
- Include a soft CTA requesting next steps or an opportunity to discuss further
- Be authentic and avoid sounding generic

Return ONLY valid JSON with this exact structure:
{
  "subject": "Your subject line here",
  "body": "Your email body here",
  "bullets": ["key point 1", "key point 2"]
}`;
}

// Fallback template
function fallbackEmail({ lead, productPitch }) {
  return {
    subject: `Application for ${lead?.role || 'the position'} - Interested Candidate`,
    body: `Hi ${lead?.name || 'there'},

I came across the ${lead?.role || 'position'} role at ${lead?.company || 'your company'} and I'm very interested in learning more.

${productPitch ? productPitch.slice(0, 200) + '...' : 'I believe my background aligns well with the requirements and I would love the opportunity to discuss how I can contribute to your team.'}

Would you be available for a brief conversation to discuss the role further?

Best regards,
[Your Name]`,
    bullets: []
  };
}

// Main export: generateEmailDraft
async function generateEmailDraft({ lead, jobDescriptionOverride, productPitch, tone, temperature, apiKey = null }) {
  const prompt = buildPrompt({ lead, jobDescriptionOverride, productPitch, tone });
  const userApiKey = apiKey || config.geminiApiKey;
  
  try {
    if (userApiKey && userApiKey.trim()) {
      const raw = await callGemini(prompt, { temperature, apiKey: userApiKey });
      // Try to parse JSON from response
      let parsed;
      try {
        // Extract JSON if wrapped in markdown code blocks
        const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/```\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : raw;
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        // If not JSON, try to extract subject/body from text
        const lines = raw.split('\n');
        parsed = {
          subject: lines.find(l => l.toLowerCase().includes('subject'))?.replace(/subject:?/i, '').trim() || `Application for ${lead?.role || 'position'}`,
          body: raw,
          bullets: []
        };
      }
      
      return {
        provider: 'gemini',
        subject: parsed.subject || fallbackEmail({ lead, productPitch }).subject,
        body: parsed.body || parsed.text || raw,
        bullets: parsed.bullets || []
      };
    } else {
      // No Gemini configured, use fallback
      logger.warn('Gemini not configured, using fallback template', { 
        hasClient: !!geminiClient, 
        hasKey: !!config.geminiApiKey,
        keyLength: config.geminiApiKey?.length || 0
      });
      return {
        provider: 'fallback',
        ...fallbackEmail({ lead, productPitch })
      };
    }
  } catch (error) {
    logger.error('AI generation failed, using fallback', { 
      error: error.message,
      stack: error.stack,
      hasClient: !!geminiClient,
      hasKey: !!config.geminiApiKey
    });
    return {
      provider: 'fallback',
      ...fallbackEmail({ lead, productPitch })
    };
  }
}

module.exports = {
  generateEmailDraft
};
