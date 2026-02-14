const express = require('express');
const router = express.Router();
const { createEvent, getEvents, joinEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// Public Route
router.get('/', getEvents);

// Protected Routes
router.post('/', protect, createEvent);   // Create Event
router.post('/join', protect, joinEvent); // 👈 Join Event (Solo)

module.exports = router;