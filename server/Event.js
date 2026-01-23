const mongoose = require('mongoose');

// पोल के ऑप्शंस के लिए छोटा स्कीमा
const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

// पोल के सवाल के लिए स्कीमा
const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [optionSchema] // ऊपर बनाए गए ऑप्शंस का एरे
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide description']
  },
  date: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  venue: {
    type: String,
    required: [true, 'Please provide venue'],
    trim: true
  },
  isLive: {
    type: Boolean,
    default: false // एडमिन इसे 'true' करेगा तब लाइव वॉल चालू होगी
  },
  polls: [pollSchema], // लाइव पोल्स का एरे
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