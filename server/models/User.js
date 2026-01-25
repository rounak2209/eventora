const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Password hide rakho
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'organizer'], // Organizer bhi add kar diya future ke liye
    default: 'student'
  },
  
  // --- ANALYTICS FIELDS ---
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Please select gender']
  },
  department: {
    type: String,
    required: [true, 'Please provide department'], // e.g., "CSE", "Civil"
    trim: true
  },
  year: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th'],
    required: [true, 'Please select year']
  },
  skills: [{
  type: String,
  trim: true
}],
bio: { // Chhota intro (e.g., "I am a frontend dev looking for a team")
  type: String,
  default: ""
},
isLookingForTeam: { // User on/off kar sakta hai
  type: Boolean,
  default: true
},
  // ------------------------------------

  // --- 🔥 NEW: OTP FIELDS (Forgot Password ke liye) ---
  otp: {
    type: String
  },
  otpExpire: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);