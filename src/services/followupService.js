const cron = require('node-cron');
const SequenceStep = require('../models/SequenceStep');
const EmailEvent = require('../models/EmailEvent');
const Lead = require('../models/Lead');
const { generateEmailDraft } = require('./aiService');
const { sendEmail, fetchRecentReplies } = require('./gmailService');
const logger = require('../utils/logger');

async function processDueFollowUps() {
  const now = new Date();
  const lowerBound = new Date(now.getTime() - 5 * 60 * 1000);

  const dueEvents = await EmailEvent.find({
    type: 'followup_due',
    occurredAt: { $gte: lowerBound, $lte: now }
  }).populate('lead campaign sequenceStep');

  for (const evt of dueEvents) {
    try {
      const lead = evt.lead;
      const campaign = evt.campaign;
      const sequenceStep = evt.sequenceStep;

      const aiDraft = await generateEmailDraft({
        jobDescription: campaign.jobDescription,
        productPitch: campaign.productPitch,
        lead,
        tone: sequenceStep.aiTone || campaign.tone,
        linkedinInsights: lead.personalizationNotes
      });

      await sendEmail({
        to: lead.email,
        subject: aiDraft.subject,
        body: aiDraft.body
      });

      await EmailEvent.create({
        lead: lead._id,
        campaign: campaign._id,
        sequenceStep: sequenceStep?._id,
        type: 'sent',
        subject: aiDraft.subject,
        snippet: aiDraft.body.slice(0, 240),
        payload: { autoFollowUp: true }
      });

      await EmailEvent.deleteOne({ _id: evt._id });
    } catch (error) {
      logger.error('Failed to send scheduled follow-up', { error: error.message });
    }
  }
}

async function checkForReplies() {
  try {
    const messages = await fetchRecentReplies({ query: 'is:inbox newer_than:1d' });
    let matchedCount = 0;

    for (const message of messages) {
      try {
        const headers = message.payload?.headers || [];
        const fromHeader = headers.find(h => h.name === 'From');
        const subjectHeader = headers.find(h => h.name === 'Subject');
        
        if (!fromHeader) continue;

        // Extract email from header
        const fromEmail = fromHeader.value.match(/<?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)>?/)?.[1];
        if (!fromEmail) continue;

        // Find lead by email
        const lead = await Lead.findOne({ email: fromEmail.toLowerCase() });
        if (!lead || lead.status === 'replied') continue;

        // Check if this is a reply
        const isReply = subjectHeader?.value?.toLowerCase().startsWith('re:') || message.threadId;

        if (isReply) {
          lead.status = 'replied';
          lead.lastRepliedAt = new Date();
          await lead.save();

          await EmailEvent.create({
            lead: lead._id,
            type: 'replied',
            subject: subjectHeader?.value || 'No subject',
            snippet: message.snippet || '',
            gmailMessageId: message.id,
            occurredAt: new Date(parseInt(message.internalDate) || Date.now())
          });

          matchedCount++;
          logger.info('Detected reply from lead', { email: lead.email, name: lead.name });
        }
      } catch (error) {
        logger.error('Error processing reply in scheduler', { error: error.message });
      }
    }

    if (matchedCount > 0) {
      logger.info(`Auto-detected ${matchedCount} reply(ies) from leads`);
    }
  } catch (error) {
    logger.error('Failed to check for replies', { error: error.message });
  }
}

function scheduleFollowUpChecks() {
  // Check for follow-ups every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    logger.debug('Running follow-up scheduler tick');
    processDueFollowUps().catch((err) => logger.error('Follow-up scheduler failed', { error: err.message }));
  });

  // Check for replies every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    logger.debug('Checking for recruiter replies');
    checkForReplies().catch((err) => logger.error('Reply checker failed', { error: err.message }));
  });
}

module.exports = {
  scheduleFollowUpChecks
};


