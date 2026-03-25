const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/config');

// ── Connection ──────────────────────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// ── User Schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  userId:    { type: Number, required: true, unique: true },
  username:  { type: String, default: null },
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  joinedAt:  { type: Date, default: Date.now },
  chatHistory: [
    {
      role:    { type: String, enum: ['user', 'assistant'] },
      content: String,
      at:      { type: Date, default: Date.now },
    }
  ],
});

// ── Group Schema ─────────────────────────────────────────────────────────────
const groupSchema = new mongoose.Schema({
  chatId:   { type: Number, required: true, unique: true },
  title:    { type: String, default: '' },
  addedAt:  { type: Date, default: Date.now },
  settings: {
    welcomeEnabled: { type: Boolean, default: true },
    stickerEnabled: { type: Boolean, default: true },
  },
});

const User  = mongoose.model('User',  userSchema);
const Group = mongoose.model('Group', groupSchema);

module.exports = { connectDB, User, Group };
