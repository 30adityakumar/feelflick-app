// scripts/phase1/explanation-generator.js
require('dotenv').config();
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateExplanation(movie, mood, userContext) {
  try {
    const prompt = `Generate a brief 1-sentence explanation (max 15 words) for why this movie matches.

Movie: ${movie.title}
Mood: ${mood}
Match Score: ${movie.match_percentage}%
Context: ${userContext}

Be specific and conversational. Focus on WHY it's a good match.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 40,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating explanation:', error.message);
    return 'Great match for your mood';
  }
}

module.exports = { generateExplanation };