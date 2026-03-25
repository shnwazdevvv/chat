const axios  = require('axios');
const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = require('../config/config');

const SYSTEM_PROMPT = `You are a friendly, witty Telegram group bot assistant.
Keep replies concise (1-3 sentences). Be helpful, warm, and slightly playful.
If someone asks for help, provide clear guidance. Never be rude.`;

/**
 * Send a message to OpenRouter and get an AI response.
 * @param {Array} history - Array of {role, content} objects (last N messages)
 * @param {string} userMessage - Latest user message
 */
async function getAIReply(history = [], userMessage) {
  if (!OPENROUTER_API_KEY) {
    return "🤖 AI is not configured yet. Please set OPENROUTER_API_KEY.";
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      // Include last 6 messages for context
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/telegram-bot',
          'X-Title': 'Telegram Group Bot',
        },
        timeout: 15000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    return reply ? reply.trim() : "🤔 I couldn't think of a response right now!";

  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    if (err.response?.status === 401) return "❌ Invalid AI API key.";
    if (err.response?.status === 429) return "⏳ Too many requests, please wait a moment!";
    return "😅 I had a brain freeze! Try again shortly.";
  }
}

module.exports = { getAIReply };
