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
    default: null // अगर टीम इवेंट नहीं है तो खाली रहेगा
  },
  // --- QR CODE & TICKET ---
  qrCodeData: {
    type: String,
    required: true,
    unique: true // यह स्कैन होने वाला यूनिक डेटा है
  },
  // --- ATTENDANCE & ANALYTICS ---
  hasAttended: {
    type: Boolean,
    default: false // गेट पर स्कैन होने पर 'true' होगा
  },
  checkInTime: {
    type: Date,
    default: null // जब 'hasAttended' true होगा, तब का समय (पीक टाइम ग्राफ के लिए)
  },
  // --- CERTIFICATE VERIFICATION ---
  certificateId: {
    type: String,
    unique: true,
    sparse: true // 'sparse' का मतलब है कि यह फील्ड null हो सकता है, लेकिन अगर वैल्यू है तो वह यूनिक होनी चाहिए
  },
  issuedAt: {
    type: Date
  }
}, { timestamps: true });

// सुनिश्चित करें कि एक यूजर एक इवेंट के लिए एक ही बार रजिस्टर करे
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);