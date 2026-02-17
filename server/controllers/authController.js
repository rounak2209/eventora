const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const QRCode = require('qrcode'); 
const bcrypt = require('bcryptjs');

// ==========================================
// 1. ADD GATEKEEPER (By Organizer)
// ==========================================
const addGatekeeper = async (req, res) => {
  try {
    const { name, email, password, assignedEventIds } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email and Password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Manual Password Hashing for Staff accounts
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'gatekeeper',
      department: 'Staff', 
      assignedEvents: assignedEventIds || []
    });

    // Send Credentials via Email
    try {
        const emailMessage = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #4F46E5;">Welcome to Event Team! 🛡️</h2>
                <p>Hello <b>${name}</b>,</p>
                <p>You have been appointed as a <b>Gatekeeper</b> for our upcoming events.</p>
                <p>Use the following credentials to access the scanner panel:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
                    <p style="margin: 0;"><b>Login ID:</b> ${email}</p>
                    <p style="margin: 5px 0 0 0;"><b>Password:</b> ${password}</p> 
                </div>
                <br>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                   style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                   Login to Duty
                </a>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: "Gatekeeper Access Granted 🔐",
            message: emailMessage
        });
    } catch (emailError) {
        console.error("Staff Email Error:", emailError.message);
    }

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Gatekeeper Added & Credentials Emailed! ✅"
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET GATEKEEPERS LIST
// ==========================================
const getGatekeepers = async (req, res) => {
    try {
        const gatekeepers = await User.find({ role: 'gatekeeper' })
            .populate('assignedEvents', 'title date venue')
            .select('-password')
            .lean(); 
        return res.json(gatekeepers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 3. REGISTER USER (Student/Organizer)
// ==========================================
const registerUser = async (req, res) => {
  try {
    // 🔥 FIX: let use kiya taki modify kar sakein
    let { name, email, password, gender, department, year, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 🔥 FIX LOGIC: Agar Student nahi hai, toh ye fields undefined kar do.
    // Empty string ("") mat bhejo, warna Mongoose enum validation fail karega.
    if (role !== 'student') {
        gender = undefined;
        department = undefined;
        year = undefined;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name, 
      email, 
      password, 
      gender, 
      department, 
      year, 
      role: role || 'student',
      checkIn: false,
      skills: [],
      bio: role === 'student' ? "Student at College" : "Event Organizer",
      isLookingForTeam: role === 'student' // Sirf students team dhoondhte hain
    });

    // Handle Post-Registration Logic (QR or Welcome Email)
    if (user) {
      const isEventRegistration = req.body.isEventRegistration; 

      if (isEventRegistration) {
        // CASE: User directly registering through an event link
        const qrCodeDataUrl = await QRCode.toDataURL(user._id.toString());
        const base64Data = qrCodeDataUrl.split(',')[1];

        try {
          await sendEmail({
            email: user.email,
            subject: "Your Event Pass 🎟️",
            message: `<h1>Welcome, ${user.name}!</h1><p>Your ID-based QR code is attached.</p>`,
            attachments: [{ filename: 'id-qr.png', content: base64Data, encoding: 'base64' }]
          });
        } catch (err) { console.log("ID Email Error"); }

      } else {
        // CASE: Normal Community Signup
        try {
          await sendEmail({
            email: user.email,
            subject: "Welcome to Eventora! 🚀",
            message: `<p>Hi ${user.name}, your account is ready. Start joining events now!</p>`
          });
        } catch (err) { console.log("Welcome Email Error"); }
      }
    }

    return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. LOGIN USER
// ==========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        user: { 
            id: user._id,
            name: user.name,
            role: user.role,
            email: user.email
        }
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 5. FORGOT & RESET PASSWORD
// ==========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; 
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP - Eventora",
        message: `<div style="text-align:center;"><h2>Your OTP</h2><h1 style="font-size:40px; color:#4F46E5;">${otp}</h1><p>Valid for 10 minutes.</p></div>`
      });
      return res.status(200).json({ success: true, message: "OTP sent to email!" });
    } catch (error) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email service down" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpire: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Invalid OTP or Expired" });

    user.password = newPassword; 
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==========================================
// HELPERS
// ==========================================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

module.exports = { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword, 
    addGatekeeper, 
    getGatekeepers 
};