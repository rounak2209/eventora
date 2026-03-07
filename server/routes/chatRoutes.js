const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { getChatHistory, markAsRead, getInboxConversations } = require('../controllers/chatController');

router.get('/history/:userId', protect, getChatHistory);
router.post('/read', protect, markAsRead);
router.get('/inbox', protect, getInboxConversations); 

module.exports = router;