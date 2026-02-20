const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getGatekeeperEvents, joinEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../config/multer'); // 👈 Multer import kiya

// Public: Sabhi Events dekhne ke liye
router.get('/', getEvents);

// Organizer Only: Naya Event banane ke liye (Upload middleware add kiya)
router.post('/', protect, upload.single('banner'), createEvent);

router.post('/join', protect, joinEvent); // 👈 Join Event (Solo)
// 🔥 Gatekeeper Route: Events + Stats dekhne ke liye
router.get('/gatekeeper-view', protect, getGatekeeperEvents);

module.exports = router;