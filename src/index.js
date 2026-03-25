// ─────────────────────────────────────────────────────────────────────────────
//  Telegram Group Bot — Main Entry
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();

const TelegramBot  = require('node-telegram-bot-api');
const { connectDB, User, Group } = require('./database');
const { loadStickers, randomSticker } = require('./stickers');
const { getAIReply }  = require('./ai');
const { buildWelcomeMessage, buildWelcomeKeyboard, buildHelpMessage, E } = require('./messages');
const { createServer } = require('./server');
const config = require('../config/config');

// ── Validate critical env vars ────────────────────────────────────────────────
if (!config.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in .env');
  process.exit(1);
}

// ── Load stickers at startup ──────────────────────────────────────────────────
const STICKER_POOL = loadStickers();

// ── Create bot instance ───────────────────────────────────────────────────────
// Use webhook in production (Render), polling in development
const IS_PROD   = !!config.WEBHOOK_URL;
const WEBHOOK_PATH = `/webhook/${config.BOT_TOKEN}`;

let bot;
if (IS_PROD) {
  bot = new TelegramBot(config.BOT_TOKEN, { webHook: { port: config.PORT } });
  const webhookUrl = `${config.WEBHOOK_URL}${WEBHOOK_PATH}`;
  bot.setWebHook(webhookUrl)
    .then(() => console.log(`🔗 Webhook set: ${webhookUrl}`))
    .catch(err => console.error('❌ Webhook error:', err.message));
} else {
  bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
  console.log('🔄 Polling mode (development)');
}

// ── HTTP server (always needed for Uptime Robot + Render port binding) ────────
createServer(bot, WEBHOOK_PATH);

// ── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ── Helper: typing action with auto-send ─────────────────────────────────────
async function sendTypingThenReply(chatId, replyFn, replyToMessageId = null) {
  try {
    await bot.sendChatAction(chatId, 'typing');
    // small delay to let users see the "typing..." indicator
    await new Promise(r => setTimeout(r, 800));
    return await replyFn();
  } catch (err) {
    console.error('sendTypingThenReply error:', err.message);
  }
}

// ── Helper: upsert user in DB ─────────────────────────────────────────────────
async function upsertUser(from) {
  try {
    await User.findOneAndUpdate(
      { userId: from.id },
      {
        userId:    from.id,
        username:  from.username || null,
        firstName: from.first_name || '',
        lastName:  from.last_name || '',
      },
      { upsert: true, new: true }
    );
  } catch (e) { /* non-critical */ }
}

// ── Helper: upsert group in DB ────────────────────────────────────────────────
async function upsertGroup(chat) {
  if (chat.type === 'private') return;
  try {
    await Group.findOneAndUpdate(
      { chatId: chat.id },
      { chatId: chat.id, title: chat.title || '' },
      { upsert: true, new: true }
    );
  } catch (e) { /* non-critical */ }
}

// ── Helper: check if bot is tagged ───────────────────────────────────────────
function isBotTagged(text, entities) {
  if (!text || !entities) return false;
  const botUser = `@${config.BOT_USERNAME}`.toLowerCase();
  for (const entity of entities) {
    if (entity.type === 'mention') {
      const mention = text.substr(entity.offset, entity.length).toLowerCase();
      if (mention === botUser) return true;
    }
  }
  return false;
}

// ── Helper: strip bot mention from text ──────────────────────────────────────
function stripMention(text, username) {
  return text.replace(new RegExp(`@${username}`, 'gi'), '').trim();
}

// ── Helper: get user chat history ────────────────────────────────────────────
async function getChatHistory(userId) {
  try {
    const user = await User.findOne({ userId });
    return user?.chatHistory || [];
  } catch { return []; }
}

// ── Helper: save message to history ──────────────────────────────────────────
async function saveToHistory(userId, role, content) {
  try {
    await User.findOneAndUpdate(
      { userId },
      {
        $push: {
          chatHistory: {
            $each:  [{ role, content }],
            $slice: -20, // keep last 20 messages
          }
        }
      }
    );
  } catch { /* non-critical */ }
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMMAND HANDLERS
// ═════════════════════════════════════════════════════════════════════════════

// /start
bot.onText(/^\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await upsertUser(msg.from);
  await upsertGroup(msg.chat);

  const name = msg.from.first_name || 'there';
  const text = (
    `${E.flower} <b>Hey ${name}!</b> ${E.heart}\n\n` +
    `I'm your group's AI-powered bot ${E.star}\n\n` +
    `${E.blue} Tag me in a group or message me here — I'll always reply!\n` +
    `${E.cupid} Use /sticker to get a surprise sticker\n` +
    `${E.think} Use /help to see everything I can do\n\n` +
    `${E.heartRed} Let's have some fun!`
  );

  await sendTypingThenReply(chatId, () =>
    bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: buildWelcomeKeyboard(),
    })
  );
});

// /help
bot.onText(/^\/help/, async (msg) => {
  const chatId = msg.chat.id;
  await upsertUser(msg.from);

  await sendTypingThenReply(chatId, () =>
    bot.sendMessage(chatId, buildHelpMessage(config.BOT_USERNAME), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '👑 Owner',   url: `https://t.me/${config.OWNER_USERNAME}` },
          { text: '🛠 Support', url: `https://t.me/${config.SUPPORT_USERNAME}` },
        ]],
      },
    })
  );
});

// /sticker — send a random sticker
bot.onText(/^\/sticker/, async (msg) => {
  const chatId = msg.chat.id;
  await upsertUser(msg.from);

  const fileId = randomSticker(STICKER_POOL);
  if (!fileId) {
    return bot.sendMessage(chatId, `${E.think} No stickers loaded yet!`, { parse_mode: 'HTML' });
  }

  try {
    await bot.sendChatAction(chatId, 'choose_sticker');
    await new Promise(r => setTimeout(r, 600));
    await bot.sendSticker(chatId, fileId, {
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    console.error('Sticker send error:', err.message);
    bot.sendMessage(chatId, `${E.think} Couldn't send a sticker right now!`, { parse_mode: 'HTML' });
  }
});

// /chat <message> — explicit AI chat command
bot.onText(/^\/chat (.+)/, async (msg, match) => {
  const chatId  = msg.chat.id;
  const userId  = msg.from.id;
  const userMsg = match[1].trim();

  await upsertUser(msg.from);
  if (!userMsg) return;

  const history = await getChatHistory(userId);

  await bot.sendChatAction(chatId, 'typing');
  const reply = await getAIReply(history, userMsg);

  await saveToHistory(userId, 'user', userMsg);
  await saveToHistory(userId, 'assistant', reply);

  bot.sendMessage(chatId, reply, {
    parse_mode: 'HTML',
    reply_to_message_id: msg.message_id,
  });
});

// /settings (admin only, group chats)
bot.onText(/^\/settings/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type === 'private') {
    return bot.sendMessage(chatId, `${E.think} This command only works in groups.`, { parse_mode: 'HTML' });
  }

  try {
    const member = await bot.getChatMember(chatId, msg.from.id);
    const isAdmin = ['administrator', 'creator'].includes(member.status);
    if (!isAdmin) {
      return bot.sendMessage(chatId, `${E.think} Only admins can use /settings.`, {
        parse_mode: 'HTML',
        reply_to_message_id: msg.message_id,
      });
    }
    const group = await Group.findOne({ chatId });
    const welcomeStatus = group?.settings?.welcomeEnabled ? '✅ On' : '❌ Off';
    const stickerStatus = group?.settings?.stickerEnabled ? '✅ On' : '❌ Off';

    bot.sendMessage(chatId, `${E.star} <b>Group Settings</b>\n\nWelcome messages: ${welcomeStatus}\nSticker replies: ${stickerStatus}`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: `Toggle Welcome (${welcomeStatus})`, callback_data: 'toggle_welcome' }],
          [{ text: `Toggle Stickers (${stickerStatus})`, callback_data: 'toggle_sticker' }],
        ],
      },
    });
  } catch (err) {
    console.error('Settings error:', err.message);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  CALLBACK QUERY HANDLER (Inline Buttons)
// ═════════════════════════════════════════════════════════════════════════════

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  try {
    switch (query.data) {

      case 'cmd_help':
        await bot.answerCallbackQuery(query.id);
        await bot.sendMessage(chatId, buildHelpMessage(config.BOT_USERNAME), {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '👑 Owner',   url: `https://t.me/${config.OWNER_USERNAME}` },
              { text: '🛠 Support', url: `https://t.me/${config.SUPPORT_USERNAME}` },
            ]],
          },
        });
        break;

      case 'toggle_welcome': {
        const member = await bot.getChatMember(chatId, userId);
        if (!['administrator', 'creator'].includes(member.status)) {
          return bot.answerCallbackQuery(query.id, { text: '❌ Admins only!', show_alert: true });
        }
        const g = await Group.findOne({ chatId });
        const newVal = !g?.settings?.welcomeEnabled;
        await Group.findOneAndUpdate({ chatId }, { 'settings.welcomeEnabled': newVal });
        await bot.answerCallbackQuery(query.id, { text: `Welcome messages: ${newVal ? 'ON ✅' : 'OFF ❌'}` });
        break;
      }

      case 'toggle_sticker': {
        const member = await bot.getChatMember(chatId, userId);
        if (!['administrator', 'creator'].includes(member.status)) {
          return bot.answerCallbackQuery(query.id, { text: '❌ Admins only!', show_alert: true });
        }
        const g = await Group.findOne({ chatId });
        const newVal = !g?.settings?.stickerEnabled;
        await Group.findOneAndUpdate({ chatId }, { 'settings.stickerEnabled': newVal });
        await bot.answerCallbackQuery(query.id, { text: `Sticker replies: ${newVal ? 'ON ✅' : 'OFF ❌'}` });
        break;
      }

      default:
        await bot.answerCallbackQuery(query.id);
    }
  } catch (err) {
    console.error('Callback error:', err.message);
    bot.answerCallbackQuery(query.id, { text: '⚠️ Error occurred', show_alert: true }).catch(() => {});
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  NEW MEMBER WELCOME
// ═════════════════════════════════════════════════════════════════════════════

bot.on('new_chat_members', async (msg) => {
  const chatId = msg.chat.id;

  // Check group settings
  try {
    const group = await Group.findOne({ chatId });
    if (group && group.settings?.welcomeEnabled === false) return;
  } catch { /* proceed */ }

  for (const member of msg.new_chat_members) {
    if (member.is_bot) continue;
    await upsertUser(member);

    const welcomeText = buildWelcomeMessage(member.first_name, msg.chat.title || 'the group');

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(r => setTimeout(r, 600));

    // Send welcome message with buttons
    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'HTML',
      reply_markup: buildWelcomeKeyboard(),
    }).catch(e => console.error('Welcome msg error:', e.message));

    // Send a welcome sticker
    const fileId = randomSticker(STICKER_POOL);
    if (fileId) {
      await new Promise(r => setTimeout(r, 500));
      bot.sendSticker(chatId, fileId).catch(e => console.error('Welcome sticker error:', e.message));
    }
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  BOT ADDED TO GROUP
// ═════════════════════════════════════════════════════════════════════════════

bot.on('my_chat_member', async (update) => {
  const chat    = update.chat;
  const newStatus = update.new_chat_member?.status;

  if (newStatus === 'member' || newStatus === 'administrator') {
    await upsertGroup(chat);
    const text = (
      `${E.flower} <b>Thanks for adding me!</b> ${E.heart}\n\n` +
      `${E.star} I'm ready to help this group.\n` +
      `${E.blue} Use /help to see what I can do!\n\n` +
      `${E.cupid} Let's make this group awesome together!`
    );
    bot.sendMessage(chat.id, text, {
      parse_mode: 'HTML',
      reply_markup: buildWelcomeKeyboard(),
    }).catch(() => {});
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN MESSAGE HANDLER — tag detection & reply
// ═════════════════════════════════════════════════════════════════════════════

bot.on('message', async (msg) => {
  // Ignore commands (handled above) and non-text
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return;

  const chatId  = msg.chat.id;
  const userId  = msg.from?.id;
  const text    = msg.text;
  const entities = msg.entities || [];

  await upsertUser(msg.from);

  const isPrivate = msg.chat.type === 'private';
  const tagged    = isBotTagged(text, entities);
  // Also reply if user replies to one of the bot's messages
  const isReplyToBot = msg.reply_to_message?.from?.is_bot && true;

  // In private chat, always respond. In group, only when tagged or replied to.
  if (!isPrivate && !tagged && !isReplyToBot) return;

  // Clean text (remove @mention)
  let userMsg = tagged ? stripMention(text, config.BOT_USERNAME) : text;
  if (!userMsg) {
    // Tagged but no text — send a sticker
    const fileId = randomSticker(STICKER_POOL);
    if (fileId) {
      await bot.sendChatAction(chatId, 'choose_sticker');
      await new Promise(r => setTimeout(r, 500));
      return bot.sendSticker(chatId, fileId, { reply_to_message_id: msg.message_id });
    }
    return;
  }

  // Show typing indicator
  await bot.sendChatAction(chatId, 'typing');

  // Get AI reply
  const history = await getChatHistory(userId);
  const aiReply = await getAIReply(history, userMsg);

  // Save history
  await saveToHistory(userId, 'user', userMsg);
  await saveToHistory(userId, 'assistant', aiReply);

  // Send reply with mention tag (auto-tag the user)
  const mentionName = msg.from.first_name || 'you';
  const mentionTag  = msg.from.username
    ? `@${msg.from.username}`
    : `<a href="tg://user?id=${userId}">${mentionName}</a>`;

  // In group chats, prefix with the user's tag
  const finalReply = msg.chat.type !== 'private'
    ? `${mentionTag} ${aiReply}`
    : aiReply;

  bot.sendMessage(chatId, finalReply, {
    parse_mode: 'HTML',
    reply_to_message_id: msg.message_id,
  }).catch(err => {
    // If HTML parse fails, try plain text
    bot.sendMessage(chatId, aiReply, { reply_to_message_id: msg.message_id }).catch(() => {});
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  ERROR HANDLERS
// ═════════════════════════════════════════════════════════════════════════════

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.code, err.message);
});

bot.on('webhook_error', (err) => {
  console.error('Webhook error:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

console.log('🤖 Bot is starting...');
