const express = require('express');
const router = express.Router();
const { createEvent, getEvents } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); // Security Guard import kiya

// Route 1: Sabhi Events dekhne ke liye (Login zaruri nahi)
router.get('/', getEvents);

// Route 2: Naya Event banane ke liye (LOGIN ZARURI HAI - protect lagaya)
router.post('/', protect, createEvent);

module.exports = router;