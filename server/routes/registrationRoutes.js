const express = require('express');
const router = express.Router();
const { registerForEvent } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/registrations
router.post('/', protect, registerForEvent);

module.exports = router;