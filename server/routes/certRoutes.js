const express = require('express');
const router = express.Router();
const { issueCertificate, verifyCertificate, issueAllCertificates } = require('../controllers/certController'); // 👈 Import Updated
const { protect } = require('../middleware/authMiddleware');


router.post('/issue', protect, issueCertificate);


router.post('/issue-all', protect, issueAllCertificates);


router.get('/verify/:certId', verifyCertificate);

module.exports = router;