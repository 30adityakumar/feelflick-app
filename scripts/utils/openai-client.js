// scripts/utils/openai-client.js

require('dotenv').config();
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 3072;
const BATCH_SIZE = 100; // OpenAI allows batch embedding
const RATE_LIMIT_DELAY = 100; // 10 req/sec for safety

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY in environment');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

class OpenAIClient {
  constructor() {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.totalCost = 0; // $0.00001 per 1k tokens for text-embedding-3-large
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Build embedding text from movie data
   */
  buildEmbeddingText(movie) {
    const parts = [];

    // Title
    parts.push(`Title: ${movie.title}`);

    // Genre
    if (movie.primary_genre) {
      parts.push(`Primary Genre: ${movie.primary_genre}`);
    }

    // Year
    if (movie.release_year) {
      parts.push(`Year: ${movie.release_year}`);
    }

    // Rating
    if (movie.vote_average && movie.vote_count) {
      parts.push(`Rating: ${movie.vote_average}/10 (${movie.vote_count} votes)`);
    }

    // Mood scores (if available)
    if (movie.pacing_score) {
      const pacing = movie.pacing_score <= 40 ? 'Slow' : movie.pacing_score >= 60 ? 'Fast-paced' : 'Moderate';
      parts.push(`Pacing: ${pacing}`);
    }

    if (movie.intensity_score) {
      const intensity = movie.intensity_score <= 40 ? 'Low intensity' : movie.intensity_score >= 70 ? 'High intensity' : 'Moderate tension';
      parts.push(`Intensity: ${intensity}`);
    }

    if (movie.emotional_depth_score) {
      const depth = movie.emotional_depth_score <= 40 ? 'Light' : movie.emotional_depth_score >= 70 ? 'Deeply moving and profound' : 'Emotionally engaging';
      parts.push(`Emotional Depth: ${depth}`);
    }

    // Cast
    if (movie.star_power) {
      const starMap = {
        'no_stars': 'Independent cast',
        'character_actors': 'Solid character actors',
        'b_list': 'Recognizable cast',
        'a_list': 'Star-studded cast',
        'mega_stars': 'Blockbuster cast'
      };
      parts.push(starMap[movie.star_power] || '');
    }

    // VFX
    if (movie.vfx_level) {
      const vfxMap = {
        'minimal': 'Minimal visual effects',
        'low': 'Light visual effects',
        'moderate': 'Moderate visual effects',
        'high': 'Heavy visual effects',
        'spectacle': 'Visual spectacle'
      };
      parts.push(vfxMap[movie.vfx_level] || '');
    }

    // Cult status
    if (movie.cult_status) {
      parts.push('Cult classic with dedicated following');
    }

    // Runtime
    if (movie.runtime) {
      const length = movie.runtime <= 90 ? 'Short' : movie.runtime >= 150 ? 'Epic length' : 'Standard length';
      parts.push(`Runtime: ${length} (${movie.runtime} minutes)`);
    }

    // Overview (limit to 200 chars)
    if (movie.overview) {
      const overview = movie.overview.length > 200 ? movie.overview.substring(0, 200) + '...' : movie.overview;
      parts.push(`Plot: ${overview}`);
    }

    return parts.join('\n');
  }

  /**
   * Generate embedding for a single movie
   */
  async generateEmbedding(movie) {
    await this.rateLimit();

    const text = this.buildEmbeddingText(movie);

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS
      });

      this.requestCount++;
      
      // Estimate cost (rough)
      const tokens = Math.ceil(text.length / 4); // Rough estimate
      this.totalCost += (tokens / 1000) * 0.00001;

      return response.data[0].embedding;
    } catch (error) {
      if (error.status === 429) {
        throw new Error('OPENAI_RATE_LIMIT');
      }
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings in batch
   */
  async generateEmbeddingsBatch(movies) {
    await this.rateLimit();

    const texts = movies.map(m => this.buildEmbeddingText(m));

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS
      });

      this.requestCount++;

      // Estimate cost
      const totalTokens = texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0);
      this.totalCost += (totalTokens / 1000) * 0.00001;

      return response.data.map(item => item.embedding);
    } catch (error) {
      if (error.status === 429) {
        throw new Error('OPENAI_RATE_LIMIT');
      }
      throw new Error(`OpenAI batch embedding failed: ${error.message}`);
    }
  }

  getRequestCount() {
    return this.requestCount;
  }

  getTotalCost() {
    return this.totalCost.toFixed(4);
  }

  resetStats() {
    this.requestCount = 0;
    this.totalCost = 0;
  }
}

module.exports = new OpenAIClient();
