const express = require('express');
const router = express.Router();
const { 
    createEvent, 
    getEvents, 
    getGatekeeperEvents, 
    joinEvent,
    updateEvent, // 🔥 Import Update
    deleteEvent, // 🔥 Import Delete
    getOrganizerEvents // 🔥 Naya Import: Organizer ke apne events ke liye
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../config/multer'); 

// Public: Sabhi Events dekhne ke liye
router.get('/', getEvents);

// 🔥 NEW: Organizer ko sirf uske events dene ke liye
router.get('/my-events', protect, getOrganizerEvents);

// Organizer Only: Naya Event banane ke liye
router.post('/', protect, upload.single('banner'), createEvent);

// 🔥 NEW: Manage Events Routes (Update & Delete)
router.put('/:id', protect, upload.single('banner'), updateEvent); // Edit Event
router.delete('/:id', protect, deleteEvent); // Delete Event

router.post('/join', protect, joinEvent); 

// Gatekeeper Route: Events + Stats dekhne ke liye
router.get('/gatekeeper-view', protect, getGatekeeperEvents);

module.exports = router;