const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

async function scrapeLinkedInSummary(profileUrl) {
  if (!profileUrl) return null;

  try {
    const response = await axios.get(profileUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const headline = $('h1').first().text().trim();
    const about = $('section.pv-about-section').text().trim() || $('div[data-view-name="profile-card"]').text().trim();

    return [headline, about].filter(Boolean).join(' — ').slice(0, 600);
  } catch (error) {
    logger.warn('Failed to scrape LinkedIn profile', { error: error.message });
    return null;
  }
}

module.exports = {
  scrapeLinkedInSummary
};


