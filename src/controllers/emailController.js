// src/controllers/emailController.js
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const EmailEvent = require('../models/EmailEvent');
const User = require('../models/User');
const { generateEmailDraft } = require('../services/aiService');
const { sendEmail, fetchRecentReplies } = require('../services/gmailService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * generateFromJD
 * POST /api/emails/generate
 * Body: { lead, jobDescriptionOverride?, productPitch?, tone?, temperature? }
 */
const generateFromJD = catchAsync(async (req, res) => {
  const { lead, jobDescriptionOverride, productPitch, tone = 'professional', temperature = 0.15 } = req.body;

  if (!lead?.email) {
    return res.status(400).json({ error: 'Lead email is required' });
  }

  // Use user's AI API key if available
  const apiKey = req.user?.aiApiKey || null;

  try {
    const draft = await generateEmailDraft({ lead, jobDescriptionOverride, productPitch, tone, temperature, apiKey });
    res.json(draft);
  } catch (err) {
    logger.warn('AI generation failed in controller, returning fallback:', err.message);
    return res.json({
      subject: `Application for ${lead.role || 'position'} - Interested Candidate`,
      body: `Hi ${lead.name || 'there'},\n\nI came across the ${lead.role || 'position'} role at ${lead.company || 'your company'} and I'm very interested in learning more.\n\n${productPitch ? productPitch.slice(0, 200) + '...' : 'I believe my background aligns well with the requirements.'}\n\nWould you be available for a brief conversation?\n\nBest regards,\n[Your Name]`,
      bullets: []
    });
  }
});

/**
 * sendWithGmail - sends email and logs EmailEvent
 * POST /api/emails/send
 * Body: { leadId, campaignId, subject, body }
 */
const sendWithGmail = catchAsync(async (req, res) => {
  const { leadId, campaignId, subject, body } = req.body;

  if (!leadId || !campaignId || !subject || !body) {
    return res.status(400).json({ error: 'leadId, campaignId, subject and body are required' });
  }

  // Only allow accessing leads owned by the user
  const lead = await Lead.findOne({ _id: leadId, user: req.user._id });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  // Only allow accessing campaigns owned by the user
  const campaign = await Campaign.findOne({ _id: campaignId, user: req.user._id });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  // Use user's Gmail credentials if available
  const userCredentials = req.user?.gmailCredentials || null;
  const senderEmail = userCredentials?.sender || req.user?.email;

  // Get user's resume if available
  const user = await User.findById(req.user._id);
  const attachments = [];
  
  if (user.resume && user.resume.path) {
    const resumePath = path.join(__dirname, '..', '..', user.resume.path);
    if (fs.existsSync(resumePath)) {
      // Determine MIME type based on file extension
      const ext = path.extname(user.resume.originalName || user.resume.filename).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      attachments.push({
        path: resumePath,
        filename: user.resume.originalName || user.resume.filename,
        mimeType: mimeTypes[ext] || 'application/pdf'
      });
    }
  }

  const gmailResp = await sendEmail({
    to: lead.email,
    subject,
    body,
    userCredentials,
    senderEmail,
    attachments
  });

  const gmailMessageId = (gmailResp && (gmailResp.id || (gmailResp.data && gmailResp.data.id))) || null;

  const event = await EmailEvent.create({
    lead: lead._id,
    campaign: campaign._id,
    sequenceStep: null,
    gmailMessageId,
    type: 'sent',
    subject,
    snippet: body.slice(0, 200)
  });

  lead.lastContactedAt = new Date();
  lead.status = 'contacted';
  await lead.save();

  res.status(201).json({ event, gmailResp });
});

/**
 * syncReplies - pulls recent replies via Gmail API and matches them to leads
 */
const syncReplies = catchAsync(async (req, res) => {
  // Use user's Gmail credentials if available
  const userCredentials = req.user?.gmailCredentials || null;
  const messages = await fetchRecentReplies({ userCredentials });
  let matchedCount = 0;
  let updatedLeads = [];

  // Process each message to find matching leads
  for (const message of messages) {
    try {
      // Extract email addresses from message headers
      const headers = message.payload?.headers || [];
      const fromHeader = headers.find(h => h.name === 'From');
      const subjectHeader = headers.find(h => h.name === 'Subject');
      
      if (!fromHeader) continue;

      // Extract email from "Name <email@domain.com>" or just "email@domain.com"
      const fromEmail = fromHeader.value.match(/<?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)>?/)?.[1];
      if (!fromEmail) continue;

      // Find lead by email - only for this user
      const lead = await Lead.findOne({ email: fromEmail.toLowerCase(), user: req.user._id });
      if (!lead) continue; // Not a lead we're tracking

      // Check if this is a reply (has "Re:" in subject or is in a thread)
      const isReply = subjectHeader?.value?.toLowerCase().startsWith('re:') || 
                     message.threadId; // Gmail threads indicate replies

      if (isReply && lead.status !== 'replied') {
        // Update lead status
        lead.status = 'replied';
        lead.lastRepliedAt = new Date();
        await lead.save();

        // Find the most recent campaign for this lead
        const recentEvent = await EmailEvent.findOne({ lead: lead._id })
          .sort({ occurredAt: -1 })
          .populate('campaign');
        
        // Create reply event
        await EmailEvent.create({
          lead: lead._id,
          campaign: recentEvent?.campaign?._id || null,
          type: 'replied',
          subject: subjectHeader?.value || 'No subject',
          snippet: message.snippet || '',
          gmailMessageId: message.id,
          occurredAt: new Date(parseInt(message.internalDate) || Date.now())
        });

        matchedCount++;
        updatedLeads.push({
          leadId: lead._id,
          email: lead.email,
          name: lead.name
        });
      }
    } catch (error) {
      logger.error('Error processing reply message', { error: error.message, messageId: message.id });
    }
  }

  res.json({ 
    count: messages.length, 
    matched: matchedCount,
    updatedLeads,
    messages: messages.slice(0, 10) // Return first 10 for debugging
  });
});

module.exports = {
  generateFromJD,
  sendWithGmail,
  syncReplies
};
