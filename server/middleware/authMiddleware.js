const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  // Check agar header mein token hai (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // "Bearer" hata ke token nikala
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123'); // Verify kiya
      req.user = await User.findById(decoded.id).select('-password'); // User ka data request mein dala
      next(); // Aage jane do
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };