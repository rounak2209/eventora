const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // 👈 Import protect
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword,
  addGatekeeper,
  getGatekeepers
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 🔥 NEW ROUTE: Sirf Organizer access karega
router.post('/add-gatekeeper', protect, addGatekeeper);
router.get('/gatekeepers', protect, getGatekeepers);
module.exports = router;