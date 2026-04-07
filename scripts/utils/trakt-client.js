// scripts/utils/trakt-client.js
/**
 * Trakt.tv API client
 *
 * Free public API — no OAuth needed for read-only movie data.
 * Rate limit: 1,000 requests / 5 minutes (~3.3 req/s).
 * We use 350ms between requests to stay well under the limit.
 *
 * Setup:
 *   1. Go to https://trakt.tv/oauth/applications/new
 *   2. Create an app (any redirect URI works for a script)
 *   3. Copy the Client ID into your .env as TRAKT_CLIENT_ID
 */

require('dotenv').config();
const axios = require('axios');

const CLIENT_ID        = process.env.TRAKT_CLIENT_ID;
const BASE_URL         = 'https://api.trakt.tv';
const RATE_LIMIT_MS    = 350;   // safe under 1000 req/5min
const REQUEST_TIMEOUT  = 10000; // 10s
const MAX_RETRIES      = 2;

class TraktClient {
  constructor() {
    this.lastRequestTime = 0;
    this.requestCount    = 0;
  }

  get isConfigured() {
    return Boolean(CLIENT_ID);
  }

  // ── private ──────────────────────────────────────────────────────────────

  async _rateLimit() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async _get(path, retries = 0) {
    if (!CLIENT_ID) {
      throw new Error('TRAKT_CLIENT_ID not set in environment');
    }

    await this._rateLimit();

    try {
      const response = await axios.get(`${BASE_URL}${path}`, {
        headers: {
          'Content-Type':      'application/json',
          'trakt-api-version': '2',
          'trakt-api-key':     CLIENT_ID,
        },
        timeout: REQUEST_TIMEOUT,
      });

      this.requestCount++;
      return response.data;

    } catch (err) {
      // 404 means Trakt doesn't have this film — not a hard error
      if (err.response?.status === 404) {
        return null;
      }

      // 429 = rate limited — back off and retry
      if (err.response?.status === 429 && retries < MAX_RETRIES) {
        const retryAfter = parseInt(err.response.headers['retry-after'] || '5') * 1000;
        await new Promise(r => setTimeout(r, retryAfter));
        return this._get(path, retries + 1);
      }

      // Transient network errors
      if (retries < MAX_RETRIES &&
          (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND')) {
        await new Promise(r => setTimeout(r, 2000 * (retries + 1)));
        return this._get(path, retries + 1);
      }

      throw err;
    }
  }

  // ── public API ────────────────────────────────────────────────────────────

  /**
   * Get community ratings for a movie.
   *
   * @param {string} imdbId  e.g. "tt0816692"
   * @returns {{ rating: number, votes: number, distribution: object } | null}
   *   rating is on a 1–10 scale.
   *   Returns null if Trakt has no record for this film.
   */
  async getMovieRatings(imdbId) {
    return this._get(`/movies/${imdbId}/ratings`);
  }

  /**
   * Get Trakt's own metadata for a movie (useful for cross-referencing IDs).
   *
   * @param {string} imdbId
   * @returns {object | null}
   */
  async getMovieSummary(imdbId) {
    return this._get(`/movies/${imdbId}?extended=full`);
  }

  getRequestCount()  { return this.requestCount; }
  resetRequestCount() { this.requestCount = 0; }
}

module.exports = new TraktClient();
