const express = require('express');
const router = express.Router();

const { bookTicket, verifyTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware'); 

router.post('/book', protect, bookTicket);

router.post('/verify', protect, verifyTicket);

module.exports = router;