const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
// Import all controllers including the new one
const { getChatHistory, markAsRead, getInboxConversations } = require('../controllers/chatController');

router.get('/history/:userId', protect, getChatHistory);
router.post('/read', protect, markAsRead);
router.get('/inbox', protect, getInboxConversations); // 🔥 New Route

module.exports = router;