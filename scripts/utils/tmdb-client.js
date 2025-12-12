require('dotenv').config();
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error('Missing TMDB_API_KEY in environment');
  process.exit(1);
}

const tmdbClient = {
  requestCount: 0,

  /**
   * Make a request to TMDB API
   */
  async request(endpoint, params = {}) {
    try {
      this.requestCount++;

      const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          ...params
        }
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('TMDB_NOT_FOUND');
      } else if (error.response?.status === 429) {
        throw new Error('TMDB_RATE_LIMIT');
      }
      throw new Error(`TMDB API Error: ${error.message}`);
    }
  },

  /**
   * Get movie details
   */
  async getMovie(movieId, appendToResponse = '') {
    const params = appendToResponse ? { append_to_response: appendToResponse } : {};
    return this.request(`/movie/${movieId}`, params);
  },

  /**
   * Get movie credits (cast and crew)
   */
  async getMovieCredits(movieId) {
    return this.request(`/movie/${movieId}/credits`);
  },

  /**
   * Get trending movies
   */
  async getTrending(timeWindow = 'week', page = 1) {
    return this.request(`/trending/movie/${timeWindow}`, { page });
  },

  /**
   * Get popular movies
   */
  async getPopular(page = 1) {
    return this.request('/movie/popular', { page });
  },

  /**
   * Get now playing movies
   */
  async getNowPlaying(page = 1) {
    return this.request('/movie/now_playing', { page });
  },

  /**
   * Discover movies with filters
   */
  async discoverMovies(filters = {}, page = 1) {
    return this.request('/discover/movie', { ...filters, page });
  },

  /**
   * Search for movies
   */
  async searchMovies(query, page = 1) {
    return this.request('/search/movie', { query, page });
  },

  /**
   * Get request count
   */
  getRequestCount() {
    return this.requestCount;
  },

  /**
   * Reset request count
   */
  resetRequestCount() {
    this.requestCount = 0;
  }
};

module.exports = tmdbClient;
