const mongoose = require('mongoose');

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
    type: String, required: [true, 'Please provide event title'], trim: true
  },
  description: {
    type: String, required: [true, 'Please provide description']
  },
  
  // 🔥 NEW: Event Banner Image URL
  banner: {
    type: String, default: ""
  },

  // --- 2. TIME & VENUE ---
  date: {
    type: Date, required: [true, 'Please provide event date']
  },
  venue: {
    type: String, required: [true, 'Please provide venue'], trim: true
  },
  registrationDeadline: { 
    type: Date, required: true
  },

  // --- 3. CATEGORY & PRICE ---
  category: {
    type: String,
    enum: ['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar'],
    required: true
  },
  price: { 
    type: Number, default: 0
  },

  // --- 4. SEATS & PARTICIPANTS ---
  maxSeats: { 
    type: Number, required: true
  },
  
  // 🔥 NEW: Solo Participants ki list (Jo team me nahi hain)
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  // --- 5. TEAM LOGIC ---
  isTeamEvent: {
    type: Boolean, default: false // True = Hackathon, False = Seminar
  },
  teamSize: { 
    min: { type: Number, default: 1 },
    max: { type: Number, default: 4 }
  },

  // --- 6. LIVE FEATURES ---
  isLive: {
    type: Boolean, default: false
  },
  polls: [pollSchema],
  
  // --- 7. ORGANIZER ---
  organizer: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);