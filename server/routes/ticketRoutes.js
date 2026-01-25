const express = require('express');
const router = express.Router();

// 1. Controller se 'bookTicket' AUR 'verifyTicket' dono import karo
const { bookTicket, verifyTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware'); // Login check

// Route 1: Ticket Book karne ke liye
// POST /api/ticket/book
router.post('/book', protect, bookTicket);

// Route 2: Ticket Verify karne ke liye (Scanner ke liye) - NEW 🚀
// POST /api/ticket/verify
// Ispe bhi 'protect' lagaya hai taaki sirf Logged-in Organizer hi scan kar sake
router.post('/verify', protect, verifyTicket);

module.exports = router;