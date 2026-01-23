const express = require('express');
const router = express.Router();
const { registerUser ,loginUser } = require('../controllers/authController');

// Jab koi POST request karega /register par, tab registerUser chalega
router.post('/register', registerUser);
router.post('/login', loginUser);
module.exports = router;