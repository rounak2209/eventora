const express = require('express');
const router = express.Router();

// 1. Controller se saare functions import karo (Naye wale bhi)
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');

// Jab koi POST request karega /register par
router.post('/register', registerUser);

// Jab koi POST request karega /login par
router.post('/login', loginUser);

// 🔥 NEW: Forgot Password Route (Email + OTP bhejne ke liye)
router.post('/forgot-password', forgotPassword);

// 🔥 NEW: Reset Password Route (OTP verify karke password badalne ke liye)
router.post('/reset-password', resetPassword);

module.exports = router;