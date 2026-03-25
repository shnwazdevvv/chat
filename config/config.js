require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_USERNAME: process.env.BOT_USERNAME || 'YourBot',
  OWNER_ID: parseInt(process.env.OWNER_ID) || 0,
  OWNER_USERNAME: process.env.OWNER_USERNAME || 'owner',
  SUPPORT_USERNAME: process.env.SUPPORT_USERNAME || 'support',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
  MONGODB_URI: process.env.MONGODB_URI,
  QDRANT_URL: process.env.QDRANT_URL,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY,
  PORT: parseInt(process.env.PORT) || 3000,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
};
