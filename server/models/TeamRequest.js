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
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['JOIN_REQUEST', 'INVITE'], 
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  message: { 
    type: String
  }
}, { timestamps: true });


requestSchema.index({ team: 1, user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('TeamRequest', requestSchema);