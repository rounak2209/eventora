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
    required: true // टीम बनाने वाला लीडर होगा
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }], // टीम के अन्य सदस्यों की लिस्ट
  description: { // Project idea kya hai?
  type: String 
},
requiredSkills: [{ // Kaise bande chahiye? (e.g. "Video Editor", "Backend")
  type: String,
  trim: true
}],
skillMatchMode: {
    type: String,
    enum: ['STRICT', 'FLEXIBLE'], // STRICT = All match, FLEXIBLE = Any match
    default: 'FLEXIBLE'            // Default flexible rakhte hain
  },
requiredYear: [{ // Array isliye taaki multiple years allow kar sakein (e.g. ["3rd", "4th"])
    type: String, 
    enum: ['1st', '2nd', '3rd', '4th'] 
  }],
isOpen: { // Kya vacancy open hai?
  type: Boolean,
  default: true
},
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// यह सुनिश्चित करने के लिए कि टीम में सदस्यों की संख्या सीमित रहे (वैकल्पिक)
teamSchema.path('members').validate(function (members) {
  return members.length <= 4; // उदाहरण: लीडर + 4 सदस्य = कुल 5 की टीम
}, 'Team can have a maximum of 5 members including the leader.');

module.exports = mongoose.model('Team', teamSchema);