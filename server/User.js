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
    select: false // पासवर्ड को डिफ़ॉल्ट रूप से क्वेरी में शामिल न करें
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  // --- ANALYTICS FIELDS (जरूरी हैं) ---
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
  // ------------------------------------
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);