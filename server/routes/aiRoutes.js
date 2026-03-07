const express = require('express');
const router = express.Router();
const { getAiSummary, chatWithEventData } = require('../controllers/aiController');


// GET: /api/ai/summary?eventId=123
router.get('/summary', getAiSummary);

// POST: /api/ai/chat
router.post('/chat', chatWithEventData);

module.exports = router;