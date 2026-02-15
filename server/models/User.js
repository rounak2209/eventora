const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 🔥 Import zaroori hai

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
    select: false // Password security ke liye hide rahega
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'organizer' ,'gatekeeper'], // Organizer bhi add kar diya future ke liye
    default: 'student'
  },
  
  // --- ANALYTICS FIELDS ---
  department: { 
    type: String,
    required: function() { return this.role === 'student'; } ,
    trim: true
  },
  
  year: { 
    type: String, 
    enum: ['1st', '2nd', '3rd', '4th'], // Tumhara jo bhi enum hai rehne do
    required: function() { return this.role === 'student'; } // Gatekeeper ke liye check nahi karega
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'], // Tumhara enum
    required: function() { return this.role === 'student'; } // Gatekeeper ke liye check nahi karega
  },
  rollNumber: { type: String },
  skills: {
    type: [String],
    default: []
  },
bio: { // Chhota intro (e.g., "I am a frontend dev looking for a team")
  type: String,
  default: ""
},
isLookingForTeam: { // User on/off kar sakta hai
  type: Boolean,
  default: true
},
  // ------------------------------------

  // --- OTP FIELDS (Forgot Password) ---
  otp: {
    type: String
  },
  otpExpire: {
    type: Date
  },

  assignedEvents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  }],


  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🔥 1. Password Auto-Hash Middleware
// Jab bhi user save hoga, ye password ko hash kar dega.
// Controller me ab manual hash karne ki zaroorat nahi hai.
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔥 2. Password Match Method
// Login karte waqt ye check karega ki password sahi hai ya nahi.
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);