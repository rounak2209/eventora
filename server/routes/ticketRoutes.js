const express = require('express');
const router = express.Router();
const { bookTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware'); // Login check karne ke liye

// Route: POST /api/ticket/book
// 'protect' ka matlab: Sirf Logged-in user hi ticket book kar sakta hai
router.post('/book', protect, bookTicket);

module.exports = router;