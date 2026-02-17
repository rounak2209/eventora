const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check karo ki Header mein "Bearer" token hai ya nahi
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // "Bearer <token>" में से सिर्फ टोकन निकालो
      token = req.headers.authorization.split(' ')[1];

      // 2. Token Verify karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      // 3. User ko find karo (Password exclude karke)
      // Note: req.user mein data dalne se aage ke routes isse use kar payenge
      req.user = await User.findById(decoded.id).select('-password');

      // 4. Safety Check: Agar user database se delete ho chuka ho
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      return next(); // Sab sahi hai, aage badho

    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 5. Agar token headers mein mila hi nahi
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };