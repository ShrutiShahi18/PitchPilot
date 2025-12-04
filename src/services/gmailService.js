// src/services/gmailService.js
const { google } = require('googleapis');
const config = require('../config/env');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Create OAuth2 client from user credentials or fallback to config
function createOAuth2Client(userCredentials = null) {
  const clientId = userCredentials?.clientId || config.gmail.clientId;
  const clientSecret = userCredentials?.clientSecret || config.gmail.clientSecret;
  const redirectUri = config.gmail.redirectUri;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const refreshToken = userCredentials?.refreshToken || config.gmail.refreshToken;
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

// Get Gmail client for a user
function getGmailClient(userCredentials = null) {
  const oauth2Client = createOAuth2Client(userCredentials);
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function encodeMessage({ to, subject, body, attachments = [] }) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    body
  ];

  // Add attachments if any
  for (const attachment of attachments) {
    if (!attachment.path || !fs.existsSync(attachment.path)) {
      logger.warn('Attachment file not found', { path: attachment.path });
      continue;
    }

    const fileContent = fs.readFileSync(attachment.path);
    const base64Content = fileContent.toString('base64');
    const filename = attachment.filename || path.basename(attachment.path);
    const mimeType = attachment.mimeType || 'application/pdf';

    message.push(
      '',
      `--${boundary}`,
      `Content-Type: ${mimeType}; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      `Content-Transfer-Encoding: base64`,
      '',
      base64Content
    );
  }

  message.push(`--${boundary}--`);

  const messageStr = message.join('\n');

  return Buffer.from(messageStr)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function ensureAuthReady(userCredentials = null, senderEmail = null) {
  const sender = senderEmail || userCredentials?.sender || config.gmail.sender;
  if (!sender) {
    throw new Error('Gmail sender email not configured');
  }
  
  const clientId = userCredentials?.clientId || config.gmail.clientId;
  const clientSecret = userCredentials?.clientSecret || config.gmail.clientSecret;
  if (!clientId || !clientSecret) {
    throw new Error('GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET not configured');
  }
  
  try {
    const oauth2Client = createOAuth2Client(userCredentials);
    const token = await oauth2Client.getAccessToken();
    if (!token || (!token.token && !token)) {
      logger.warn('No access token obtained; refresh token may be missing or invalid');
    }
  } catch (err) {
    logger.error('Error obtaining access token', err.message);
    throw new Error('Failed to obtain access token. Check GMAIL_REFRESH_TOKEN and OAuth2 client configuration.');
  }
}

async function sendEmail({ to, subject, body, userCredentials = null, senderEmail = null, attachments = [] }) {
  await ensureAuthReady(userCredentials, senderEmail);

  const raw = encodeMessage({ to, subject, body, attachments });
  const gmail = getGmailClient(userCredentials);

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    logger.info('Email sent via Gmail API', { id: response.data && response.data.id, hasAttachments: attachments.length > 0 });
    return response.data || response;
  } catch (err) {
    logger.error('Failed to send email via Gmail API', { message: err.message, stack: err.stack });
    throw new Error(`Failed to send email: ${err.message}`);
  }
}

async function fetchRecentReplies({ query = 'is:inbox newer_than:7d', userCredentials = null } = {}) {
  await ensureAuthReady(userCredentials);

  const gmail = getGmailClient(userCredentials);

  try {
    const list = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      labelIds: ['INBOX']
    });

    const messages = list.data.messages || [];

    const detailed = await Promise.all(
      messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'To', 'Date']
        });

        return full.data;
      })
    );

    return detailed;
  } catch (err) {
    logger.error('Failed to fetch recent replies', { message: err.message, stack: err.stack });
    throw new Error(`Failed to fetch messages: ${err.message}`);
  }
}

module.exports = {
  sendEmail,
  fetchRecentReplies
};
