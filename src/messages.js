const { OWNER_USERNAME, SUPPORT_USERNAME, BOT_USERNAME } = require('../config/config');

/**
 * Premium emoji format used by Telegram for custom emoji stickers.
 * These render as animated/premium emojis in supported Telegram clients.
 */
const E = {
  heart:    '<emoji id="6111842580805195879">❤️</emoji>',
  flower:   '<emoji id="6111926452926553087">🌸</emoji>',
  cat:      '<emoji id="6111756629919669206">🐈</emoji>',
  blue:     '<emoji id="6111750844598721255">💙</emoji>',
  think:    '<emoji id="6111754568335366518">🤔</emoji>',
  cupid:    '<emoji id="6109158677216761865">💘</emoji>',
  star:     '<emoji id="6111622218918140460">🤩</emoji>',
  heartRed: '<emoji id="5391297242067922120">❤️</emoji>',
};

/**
 * Build the welcome message for new group members.
 */
function buildWelcomeMessage(firstName, chatTitle) {
  const name = firstName ? firstName : 'friend';
  return (
    `${E.flower} <b>Welcome to ${chatTitle}!</b> ${E.flower}\n\n` +
    `Hey <b>${name}</b>! ${E.heart} We're so glad you joined us ${E.cupid}\n\n` +
    `${E.cat} <i>This group is powered by an AI bot — just tag me anytime!</i>\n\n` +
    `${E.blue} <b>What I can do:</b>\n` +
    `${E.star} Reply to your messages with AI\n` +
    `${E.heartRed} Send random stickers when you tag me\n` +
    `${E.think} Answer questions and help the group\n\n` +
    `${E.flower} Type /help to see all commands ${E.heart}`
  );
}

/**
 * Inline keyboard buttons shown on welcome message.
 */
function buildWelcomeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '👑 Owner', url: `https://t.me/${OWNER_USERNAME}` },
        { text: '🛠 Support', url: `https://t.me/${SUPPORT_USERNAME}` },
      ],
      [
        { text: '📖 Help & Commands', callback_data: 'cmd_help' },
      ],
    ],
  };
}

/**
 * Build the /help message.
 */
function buildHelpMessage(botUsername) {
  const bot = botUsername || BOT_USERNAME;
  return (
    `${E.star} <b>Bot Commands</b> ${E.star}\n\n` +
    `<b>General:</b>\n` +
    `• /start — Welcome message\n` +
    `• /help — Show this help menu\n` +
    `• /sticker — Get a random sticker ${E.flower}\n\n` +
    `<b>AI Chat:</b>\n` +
    `• Tag <code>@${bot}</code> in a group → I'll reply!\n` +
    `• Reply to my message → I continue the conversation\n` +
    `• /chat <i>message</i> — Start an AI conversation\n\n` +
    `<b>Fun:</b>\n` +
    `• /sticker — Random sticker from the pack ${E.heart}\n\n` +
    `<b>Admin:</b>\n` +
    `• /settings — (Group admins only) configure the bot\n\n` +
    `${E.cupid} <i>Made with love. Enjoy!</i> ${E.heartRed}`
  );
}

module.exports = { buildWelcomeMessage, buildWelcomeKeyboard, buildHelpMessage, E };
