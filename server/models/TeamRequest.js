const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['JOIN_REQUEST', 'INVITE'], // JOIN_REQUEST = User ne kiya, INVITE = Team ne kiya
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  message: { // Optional message (e.g., "Mujhe React aata hai")
    type: String
  }
}, { timestamps: true });

// Ek user ek team ko baar baar request na bhej sake
requestSchema.index({ team: 1, user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('TeamRequest', requestSchema);