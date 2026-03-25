# 🤖 Telegram Group Bot

A feature-rich Telegram group bot with AI chat, sticker packs, welcome messages with premium emojis, typing animations, and auto-tagging.

---

## ✨ Features

- **AI Chat** via OpenRouter — responds when tagged `@bot` in groups or in private chat
- **Auto-tag & Reply** — mentions the user in group replies
- **Typing Animation** — shows "typing..." before every reply
- **Premium Emojis** in welcome messages (animated custom emoji)
- **Random Sticker Sender** — sends stickers from your uploaded packs
- **Welcome Messages** — greets new members with buttons (Owner / Support / Help)
- **MongoDB** — stores users, groups, and chat history
- **Qdrant** — vector DB ready for future semantic memory
- **Uptime Robot** compatible `/health` endpoint
- **Render.com** ready with `render.yaml`

---

## 📁 Project Structure

```
telegram-bot/
├── src/
│   ├── index.js       # Main bot logic
│   ├── ai.js          # OpenRouter AI integration
│   ├── database.js    # MongoDB models
│   ├── messages.js    # Welcome & help messages (premium emojis)
│   ├── server.js      # Express server (health + webhook)
│   └── stickers.js    # Sticker loader
├── stickers/
│   ├── pack1.txt      # Sticker file IDs (pack 1)
│   └── pack2.txt      # Sticker file IDs (pack 2)
├── config/
│   └── config.js      # Environment variable loader
├── .env.example       # Template — copy to .env
├── render.yaml        # Render.com deployment config
└── package.json
```

---

## 🚀 Setup Guide

### 1. Clone & Install

```bash
git clone https://github.com/yourname/telegram-bot.git
cd telegram-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `BOT_TOKEN` | [@BotFather](https://t.me/BotFather) on Telegram |
| `BOT_USERNAME` | Your bot's username (without @) |
| `OWNER_ID` | Your Telegram user ID (use @userinfobot) |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) → Keys |
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect |
| `QDRANT_URL` + `QDRANT_API_KEY` | [cloud.qdrant.io](https://cloud.qdrant.io) |
| `WEBHOOK_URL` | Your Render app URL (e.g. `https://mybot.onrender.com`) |

### 3. Run Locally (polling mode)

```bash
# Leave WEBHOOK_URL empty in .env for local dev
npm run dev
```

---

## ☁️ Deploy to Render

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — just set the secret env vars in the dashboard
5. Deploy! Your bot URL will be `https://yourapp.onrender.com`
6. Set `WEBHOOK_URL=https://yourapp.onrender.com` in Render env vars

> **Port**: Render uses port `3000` by default (set in `render.yaml`)

---

## 💓 Uptime Robot Setup

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor → **HTTP(s)**
3. URL: `https://yourapp.onrender.com/health`
4. Interval: every **5 minutes**

This keeps your Render free-tier app awake!

---

## 🎴 Adding More Stickers

Add more `.txt` files to the `stickers/` directory. Each line should be a Telegram sticker `file_id`.

To get a sticker's `file_id`, forward a sticker to [@RawDataBot](https://t.me/RawDataBot) on Telegram.

---

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Show welcome message |
| `/help` | Show all commands |
| `/sticker` | Get a random sticker |
| `/chat <message>` | Chat with AI |
| `/settings` | (Admins) Configure group settings |

---

## 📦 Environment Variables Reference

```env
BOT_TOKEN=            # Required
BOT_USERNAME=         # Required (no @)
OWNER_ID=             # Your numeric Telegram ID
OWNER_USERNAME=       # Your Telegram username
SUPPORT_USERNAME=     # Support account username
OPENROUTER_API_KEY=   # Required for AI chat
OPENROUTER_MODEL=     # Default: mistralai/mistral-7b-instruct
MONGODB_URI=          # Required
QDRANT_URL=           # Optional (for vector memory)
QDRANT_API_KEY=       # Optional
WEBHOOK_URL=          # Production only (leave blank for local)
PORT=3000             # Default Render port
```

---

## 🛡️ License

MIT — free to use and modify.
