const User = require('../models/User');
const Event = require('../models/Event'); 
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const QRCode = require('qrcode'); 
const bcrypt = require('bcryptjs');

// ==========================================
// 1. ADD GATEKEEPER (Smart Add by Organizer)
// ==========================================
const addGatekeeper = async (req, res) => {
  try {
    const { name, email, password, assignedEventIds } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email and Password are required" });
    }

    if (assignedEventIds && assignedEventIds.length > 0) {
        const validEvents = await Event.find({ 
            _id: { $in: assignedEventIds }, 
            organizer: req.user._id 
        });
        if (validEvents.length !== assignedEventIds.length) {
            return res.status(403).json({ message: "Security Alert: You can only assign events you created!" });
        }
    }

    let user = await User.findOne({ email }).select('+password');

    if (user) {
        if (user.role !== 'gatekeeper') {
             return res.status(400).json({ message: "User exists but is not a gatekeeper." });
        }
        
        const currentEvents = user.assignedEvents.map(id => id.toString());
        const newEventsToAdd = assignedEventIds || [];
        const updatedEvents = [...new Set([...currentEvents, ...newEventsToAdd])];
        
        user.assignedEvents = updatedEvents;
        await user.save(); 
        
        return res.status(200).json({ 
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: "Existing Gatekeeper updated with new duties! ✅" 
        });
    }

    user = await User.create({
      name,
      email,
      password: password,
      role: 'gatekeeper', 
      assignedEvents: assignedEventIds || []
    });

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

    // 🔥 FIX: Non-blocking email, website nahi atkegi
    sendEmail({
        email: user.email,
        subject: "Gatekeeper Access Granted 🔐",
        message: emailMessage
    }).catch(err => console.error("Gatekeeper Email Error:", err.message));

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
        const organizerEvents = await Event.find({ organizer: req.user._id }).select('_id');
        const eventIds = organizerEvents.map(event => event._id);

        const gatekeepers = await User.find({ 
            role: 'gatekeeper',
            assignedEvents: { $in: eventIds } 
        })
        .populate('assignedEvents', 'title date venue')
        .select('-password')
        .lean(); 

        return res.json(gatekeepers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 3. UPDATE GATEKEEPER DUTIES 
// ==========================================
const updateGatekeeper = async (req, res) => {
    try {
        const { assignedEventIds } = req.body;
        
        if (assignedEventIds && assignedEventIds.length > 0) {
            const validEvents = await Event.find({ 
                _id: { $in: assignedEventIds }, 
                organizer: req.user._id 
            });
            if (validEvents.length !== assignedEventIds.length) {
                return res.status(403).json({ message: "Security Alert: You can only assign your own events!" });
            }
        }

        const gatekeeper = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'gatekeeper' }, 
            { $set: { assignedEvents: assignedEventIds } },
            { new: true }
        );
        
        if (!gatekeeper) {
            return res.status(404).json({ message: "Gatekeeper not found" });
        }
        
        return res.json({ message: "Duties updated successfully! ✏️" });
    } catch (error) {
        console.error("Update Gatekeeper Error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 4. REMOVE GATEKEEPER
// ==========================================
const deleteGatekeeper = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        return res.json({ message: "Gatekeeper removed permanently! 🗑️" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 5. REGISTER USER 
// ==========================================
const registerUser = async (req, res) => {
  try {
    let { name, email, password, gender, department, year, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

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
      isLookingForTeam: role === 'student' 
    });

    if (user) {
      const isEventRegistration = req.body.isEventRegistration; 

      if (isEventRegistration) {
        const qrCodeDataUrl = await QRCode.toDataURL(user._id.toString());
        const base64Data = qrCodeDataUrl.split(',')[1];

        // 🔥 FIX: Non-blocking mail
        sendEmail({
            email: user.email,
            subject: "Your Event Pass 🎟️",
            message: `<h1>Welcome, ${user.name}!</h1><p>Your ID-based QR code is attached.</p>`,
            attachments: [{ filename: 'id-qr.png', content: base64Data }]
        }).catch(err => console.log("ID Email Error"));

      } else {
        // 🔥 FIX: Non-blocking mail
        sendEmail({
            email: user.email,
            subject: "Welcome to Eventora! 🚀",
            message: `<p>Hi ${user.name}, your account is ready. Start joining events now!</p>`
        }).catch(err => console.log("Welcome Email Error"));
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
// 6. LOGIN USER
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
// 7. FORGOT & RESET PASSWORD
// ==========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await User.findByIdAndUpdate(user._id, { 
        otp: otp, 
        otpExpire: Date.now() + 10 * 60 * 1000 
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP - Eventora",
        message: `<div style="text-align:center;"><h2>Your OTP</h2><h1 style="font-size:40px; color:#4F46E5;">${otp}</h1><p>Valid for 10 minutes.</p></div>`
      });
      return res.status(200).json({ success: true, message: "OTP sent to email!" });
    } catch (error) {
      await User.findByIdAndUpdate(user._id, { $unset: { otp: 1, otpExpire: 1 } });
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
// 8. UPDATE PASSWORD (FROM PROFILE)
// ==========================================
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

module.exports = { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword, 
    addGatekeeper, 
    getGatekeepers,
    updateGatekeeper, 
    deleteGatekeeper, 
    updatePassword 
};