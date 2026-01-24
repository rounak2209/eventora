const mongoose = require('mongoose');

// Poll Schema (Same as before)
const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [optionSchema]
});

const eventSchema = new mongoose.Schema({
  // --- 1. BASIC INFO ---
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide description']
  },
  // bannerUrl HATA DIYA ❌
  
  // --- 2. TIME & VENUE ---
  date: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  venue: {
    type: String,
    required: [true, 'Please provide venue'],
    trim: true
  },
  registrationDeadline: { // ⏳ DEADLINE (Zaruri hai taaki entry band kar sakein)
    type: Date,
    required: true
  },

  // --- 3. CATEGORY & PRICE ---
  category: {
    type: String,
    enum: ['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar'],
    required: true
  },
  price: { // 💰 MONEY (0 matlab Free)
    type: Number,
    default: 0
  },

  // --- 4. SEATS & LIMITS ---
  maxSeats: { // 🪑 CAPACITY (Example: 100 seats)
    type: Number,
    required: true
  },
  registeredCount: { // Kitne log ab tak aaye
    type: Number,
    default: 0
  },

  // --- 5. TEAM LOGIC (Developer 2 ke liye Important) ---
  isTeamEvent: {
    type: Boolean,
    default: false
  },
  teamSize: { // Min-Max members (Agar team event hai)
    min: { type: Number, default: 1 },
    max: { type: Number, default: 1 }
  },

  // --- 6. LIVE FEATURES ---
  isLive: {
    type: Boolean,
    default: false
  },
  polls: [pollSchema],
  
  // --- 7. ORGANIZER ---
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);