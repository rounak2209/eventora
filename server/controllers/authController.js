const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); 
// Note: bcrypt import ki zaroorat yahan nahi hai kyunki hash Model me ho raha hai

// --- Helper: Generate Token ---

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
  
};

// ==========================================
// 1. REGISTER USER 🚀
// ==========================================
const registerUser = async (req, res) => {
  try {
    // Frontend se ye sab aa raha hai
    const { name, email, password, gender, department, year, role } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password || !gender || !department || !year) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // 2. Check Existence
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3. Create User (Password Hashing Model khud karega 'pre-save' me)
    const user = await User.create({
      name,
      email,
      password, // 🔥 Direct bhejo, Model hash kar dega
      gender,
      department,
      year,
      role: role || 'student',
      // Defaults
      skills: [],
      bio: "Hey there! I am using Hackathon Hub.",
      isLookingForTeam: true
    });

    if (user) {
      // 4. Welcome Email Bhejo (Non-blocking)
      try {
        await sendEmail({
          email: user.email,
          subject: "Welcome to Hackathon Hub! 🚀",
          message: `<p>Hi ${user.name}, Welcome! Your account is ready.</p>`
        });
      } catch (err) {
        console.log("Email failed but user created:", err.message);
      }

      // 5. Response Bhejo
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        user: user
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. LOGIN USER 🔑
// ==========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // 1. Check User (Password select karna padega kyunki model me select:false hai)
    const user = await User.findOne({ email }).select('+password');

    // 2. Check Password using Model Method
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        user: user
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. FORGOT PASSWORD (OTP) 🔥
// ==========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
    await user.save(); // Model ka pre-save hook password hash nahi karega agar wo change nahi hua

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP",
        message: `Your OTP is: ${otp}`
      });
      res.status(200).json({ success: true, message: "OTP sent to email!" });
    } catch (error) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      res.status(500).json({ message: "Email send failed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. RESET PASSWORD 🔐
// ==========================================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpire: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Invalid OTP or Expired" });

    // Update Password (ye plain text jayega, Model ka pre-save hook isse hash karega)
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Password Changed!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };