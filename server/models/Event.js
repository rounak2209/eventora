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

  title: {
    type: String, required: [true, 'Please provide event title'], trim: true
  },
  description: {
    type: String, required: [true, 'Please provide description']
  },
  

  banner: {
    type: String, default: ""
  },


  date: {
    type: Date, required: [true, 'Please provide event date']
  },
  venue: {
    type: String, required: [true, 'Please provide venue'], trim: true
  },
  registrationDeadline: { 
    type: Date, required: true
  },


  category: {
    type: String,
    enum: ['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar'],
    required: true
  },
  price: { 
    type: Number, default: 0
  },

  
  maxSeats: { 
    type: Number, required: true
  },
  
 
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],


  joinedTeams: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team' 
  }],


  isTeamEvent: {
    type: Boolean, default: false 
  },
  teamSize: { 
    min: { type: Number, default: 1 },
    max: { type: Number, default: 4 }
  },


  isLive: {
    type: Boolean, default: false
  },
  polls: [pollSchema],
  

  organizer: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },


  cachedAiSummary: {
    type: String,
    default: ""
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);