const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true,
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }], 
  description: { 
    type: String 
  },
  requiredSkills: [{ 
    type: String,
    trim: true
  }],
  skillMatchMode: {
    type: String,
    enum: ['STRICT', 'FLEXIBLE'], 
    default: 'FLEXIBLE'            
  },
  requiredYear: [{ 
    type: String, 
    enum: ['1st', '2nd', '3rd', '4th'] 
  }],
  isOpen: { 
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

teamSchema.path('members').validate(function (members) {
  return members.length <= 4; 
}, 'Team can have a maximum of 4 members.'); 

module.exports = mongoose.model('Team', teamSchema);