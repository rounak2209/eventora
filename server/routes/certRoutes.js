const express = require('express');
const router = express.Router();
const { issueCertificate, verifyCertificate, issueAllCertificates } = require('../controllers/certController'); // 👈 Import Updated
const { protect } = require('../middleware/authMiddleware');

// Single User ke liye
router.post('/issue', protect, issueCertificate);

// 🔥 BULK ISSUE (Sabke liye)
router.post('/issue-all', protect, issueAllCertificates);

// Verify Public Route
router.get('/verify/:certId', verifyCertificate);

module.exports = router;