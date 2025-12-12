// scripts/utils/omdb-client.js

require('dotenv').config();
const axios = require('axios');

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = 'http://www.omdbapi.com/';
const DAILY_QUOTA = 1000; // Free tier limit
const RATE_LIMIT_DELAY = 1000; // 1 request per second

if (!OMDB_API_KEY) {
  throw new Error('Missing OMDB_API_KEY in environment');
}

class OMDBClient {
  constructor() {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.quotaWarningShown = false;
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  async request(imdbId) {
    // Check quota
    if (this.requestCount >= DAILY_QUOTA) {
      throw new Error('OMDB_QUOTA_EXCEEDED');
    }

    // Warn at 90% quota
    if (this.requestCount >= DAILY_QUOTA * 0.9 && !this.quotaWarningShown) {
      console.warn(`⚠️  OMDb quota warning: ${this.requestCount}/${DAILY_QUOTA} used (90%)`);
      this.quotaWarningShown = true;
    }

    await this.rateLimit();

    try {
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: OMDB_API_KEY,
          i: imdbId,
          plot: 'short'
        },
        timeout: 10000
      });

      this.requestCount++;

      if (response.data.Response === 'False') {
        throw new Error(`OMDb error: ${response.data.Error}`);
      }

      return response.data;
    } catch (error) {
      if (error.message.includes('OMDb error')) {
        throw error;
      }
      throw new Error(`OMDb request failed: ${error.message}`);
    }
  }

  /**
   * Get ratings for a movie by IMDb ID
   */
  async getRatings(imdbId) {
    const data = await this.request(imdbId);

    // Parse ratings
    const ratings = {
      imdb_rating: parseFloat(data.imdbRating) || null,
      imdb_votes: parseInt(data.imdbVotes?.replace(/,/g, '')) || null,
      rt_rating: null,
      metacritic_score: null
    };

    // Extract Rotten Tomatoes
    const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
    if (rtRating) {
      ratings.rt_rating = rtRating.Value; // e.g., "95%"
    }

    // Extract Metacritic
    const metaRating = data.Ratings?.find(r => r.Source === 'Metacritic');
    if (metaRating) {
      const match = metaRating.Value.match(/(\d+)/);
      ratings.metacritic_score = match ? parseInt(match[1]) : null;
    }

    return ratings;
  }

  getRequestCount() {
    return this.requestCount;
  }

  getQuotaRemaining() {
    return DAILY_QUOTA - this.requestCount;
  }

  resetRequestCount() {
    this.requestCount = 0;
    this.quotaWarningShown = false;
  }
}

module.exports = new OMDBClient();
