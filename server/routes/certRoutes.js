const express = require('express');
const router = express.Router();
const { issueCertificate, verifyCertificate } = require('../controllers/certController');
const { protect } = require('../middleware/authMiddleware');

// Issue karne ke liye Admin/Login hona zaruri hai
router.post('/issue', protect, issueCertificate);

// Verify koi bhi kar sakta hai (Public)
router.get('/verify/:certId', verifyCertificate);

module.exports = router;