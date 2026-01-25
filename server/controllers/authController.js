const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); // 📨 Email Import zaruri hai

// 1. REGISTER USER (With Welcome Email) 📧
const registerUser = async (req, res) => {
  try {
    const { name, email, password, gender, department, year, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      name, email, password: hashedPassword, gender, department, year, role: role || 'student'
    });

    if (user) {
      // 🎉 EMAIL BHEJO: Welcome Message
      try {
        await sendEmail({
          email: user.email,
          subject: "Welcome to Campus Connect! 🚀",
          message: `<p>Hi ${user.name},</p><p>Thank you for registering on our platform.</p>`
        });
      } catch (err) {
        console.log("Email error:", err.message); // Email fail hone par bhi user ban jaye
      }

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: "Registration Successful! Check your Email 📧"
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. LOGIN USER (Same as before)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: "Login Successful! 🚀"
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. FORGOT PASSWORD (OTP Generate & Email) 🔥
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // A. 6 Digit OTP Banao
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // B. Database me save karo (10 min expiry)
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; 
    await user.save();

    // C. Email Bhejo
    const message = `
      <h1>Password Reset Request</h1>
      <p>Your OTP for password reset is: <b style="font-size: 24px;">${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP 🔐",
        message
      });
      res.status(200).json({ success: true, message: "OTP sent to email!" });
    } catch (error) {
      user.otp = undefined; // Fail hua to OTP hata do
      user.otpExpire = undefined;
      await user.save();
      res.status(500).json({ message: "Email could not be sent" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. RESET PASSWORD (Verify OTP & Change Password) 🔐
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check OTP and Expiry
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpire: { $gt: Date.now() } // Time check
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or Expired" });
    }

    // Password Update Karo
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // OTP clear kar do
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password Reset Successful! Login Now." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

// Export all 4 functions
module.exports = { registerUser, loginUser, forgotPassword, resetPassword };