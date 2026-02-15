const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const QRCode = require('qrcode'); // 📦 QR Code Import kiya
const bcrypt = require('bcryptjs'); // 🔥 Added: Ye zaroori hai addGatekeeper ke liye

// 🔥 NEW: Organizer Gatekeeper Create Karega
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

    // 🔥 FIX: Manual Password Hashing
    // Hum middleware ke bharose nahi rahenge, yahin hash kar denge.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // 👈 Database me HASH save karo
      role: 'gatekeeper',
      department: 'Staff', 
      assignedEvents: assignedEventIds || []
    });

    // 4. Send Email (Send ORIGINAL Password, NOT Hash)
    try {
        const emailMessage = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #4F46E5;">Welcome to Event Team! 🛡️</h2>
                <p>Hello <b>${name}</b>,</p>
                <p>You have been appointed as a <b>Gatekeeper</b>.</p>
                <p>Here are your login credentials:</p>
                <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Password:</b> ${password}</p> 
                </div>
                <p><i>(Note: This password allows you to access the scanner.)</i></p>
                <br>
                <a href="http://localhost:5173/login" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: "Gatekeeper Access Granted 🔐",
            message: emailMessage
        });
        console.log(`Credentials sent to ${user.email}`);
    } catch (emailError) {
        console.error("Email sending failed:", emailError);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Gatekeeper Added & Securely Hashed! ✅"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gatekeepers List Fetch karna (Display ke liye)
const getGatekeepers = async (req, res) => {
    try {
        // Populate assignedEvents taaki frontend pe event ke naam dikha sakein
        const gatekeepers = await User.find({ role: 'gatekeeper' })
            .populate('assignedEvents', 'title'); 
        res.json(gatekeepers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 1. REGISTER USER (With QR Code Ticket) 📧
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

    // Create User (Default checkIn status false rahega)
    const user = await User.create({
      name, 
      email, 
      password, 
      gender, 
      department, 
      year, 
      role: role || 'student',
      checkIn: false, // 🆕 New field for scanner logic
      skills: [],
      bio: "Hey there! I am using Hackathon Hub.",
      isLookingForTeam: true
    });

    if (user) {
      // Logic: Frontend se check karo ki ye Event Registration hai ya Normal Signup
      const isEventRegistration = req.body.isEventRegistration && true; 

      if (isEventRegistration) {
        // 🎫 CASE 1: Event Ticket Email (Campus Connect)
        
        // QR Code Generation
        const qrCodeDataUrl = await QRCode.toDataURL(user._id.toString());
        const base64Data = qrCodeDataUrl.split(',')[1];

        try {
          await sendEmail({
            email: user.email,
            subject: "Your Event Ticket & QR Code 🎟️",
            message: `
              <h1>Welcome to Campus Connect, ${user.name}! 🚀</h1>
              <p>Registration Successful.</p>
              <p>Please find your <b>Entry Ticket (QR Code)</b> attached below.</p>
              <p>Show this QR code at the event gate for scanning.</p>
            `,
            attachments: [
              {
                filename: 'ticket-qr.png',
                content: base64Data,
                encoding: 'base64'
              }
            ]
          });
        } catch (err) {
          console.log("Ticket Email Error:", err.message);
        }

      } else {
        // 👋 CASE 2: General Welcome Email (Hackathon Hub / Normal Signup)
        try {
          await sendEmail({
            email: user.email,
            subject: "Welcome to Hackathon Hub! 🚀",
            message: `<p>Hi ${user.name}, Welcome! Your account is ready. Complete your profile to find a team.</p>`
          });
        } catch (err) {
          console.log("Welcome Email Error:", err.message);
        }
      }
    }

    // ✅ FIX: Added Response & Closed function properly
    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });

  } catch (error) {
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const message = `
      <h1>Password Reset Request</h1>
      <p>Your OTP is: <b style="font-size: 24px;">${otp}</b></p>
      <p>Valid for 10 minutes.</p>
    `;

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

// 4. RESET PASSWORD
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

    res.status(200).json({ success: true, message: "Password Reset Successful! Login Now." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, addGatekeeper, getGatekeepers };