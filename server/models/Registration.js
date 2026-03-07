const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null 
  },

  qrCodeData: {
    type: String,
    required: true,
    unique: true 
  },

  hasAttended: {
    type: Boolean,
    default: false 
  },
  checkInTime: {
    type: Date,
    default: null 
  },
  // --- CERTIFICATE VERIFICATION ---
  certificateId: {
    type: String,
    unique: true,
    sparse: true 
  },
  issuedAt: {
    type: Date
  }
}, { timestamps: true });

registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);