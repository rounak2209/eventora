const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getGatekeeperEvents } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); 

// Public: Sabhi Events dekhne ke liye
router.get('/', getEvents);

// Organizer Only: Naya Event banane ke liye
router.post('/', protect, createEvent);

// 🔥 Gatekeeper Route: Events + Stats dekhne ke liye
router.get('/gatekeeper-view', protect, getGatekeeperEvents);

module.exports = router;