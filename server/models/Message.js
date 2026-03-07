const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Recipient can be a User ID (for 1-on-1) or Team ID (for Group Chat)
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true }, 
  content: { type: String, required: true },
  isGroup: { type: Boolean, default: false }, 
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);