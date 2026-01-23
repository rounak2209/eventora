const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER USER (Naya account banana)
// Route: POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, gender, department, year, role } = req.body;

    // Check agar data missing hai
    if (!name || !email || !password || !gender || !department || !year) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Check agar user pehle se hai
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Password Hash karna
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      department,
      year,
      role: role || 'student'
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: "Registration Successful! 🎉"
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. LOGIN USER (Account kholna) -- YE RAHA JO CHAHIYE THA
// Route: POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email check karo
    // Note: Humne Model me 'select: false' lagaya tha password pe, 
    // isliye yaha '.select("+password")' likhna zaruri hai taaki password check ho sake.
    const user = await User.findOne({ email }).select('+password');

    // User check karo aur Password match karo
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id), // Login ke baad naya token milega
        message: "Login Successful! 🚀"
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Token Generator Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// Dono functions export karna mat bhoolna
module.exports = { registerUser, loginUser };