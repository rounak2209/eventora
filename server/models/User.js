const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

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
    select: false 
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'organizer' ,'gatekeeper'], 
    default: 'student'
  },
  

  profilePic: {
    type: String,
    default: ""
  },


  department: { 
    type: String,
    required: function() { return this.role === 'student'; } ,
    trim: true
  },
  
  year: { 
    type: String, 
    enum: ['1st', '2nd', '3rd', '4th'], 
    required: function() { return this.role === 'student'; } 
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'], 
    required: function() { return this.role === 'student'; } 
  },
  rollNumber: { type: String },
  skills: {
    type: [String],
    default: []
  },
  bio: { 
    type: String,
    default: ""
  },
  isLookingForTeam: { 
    type: Boolean,
    default: true
  },


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


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);