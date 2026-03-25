const express = require('express');
const { PORT } = require('../config/config');

function createServer(bot, webhookPath) {
  const app = express();
  app.use(express.json());

  // ── Health / Uptime Robot ping endpoint ─────────────────────────────────
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      bot: 'Telegram Group Bot',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
  });

  // ── Telegram Webhook endpoint ────────────────────────────────────────────
  if (webhookPath) {
    app.post(webhookPath, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  }

  app.listen(PORT, () => {
    console.log(`🌐 HTTP server running on port ${PORT}`);
    console.log(`💓 Uptime Robot: ping https://your-app.onrender.com/health`);
  });

  return app;
}

module.exports = { createServer };
