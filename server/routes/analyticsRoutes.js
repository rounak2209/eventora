const express = require('express');
const router = express.Router();
const { 
  getEventAnalytics, 
  emailAnalyticsReport, 
  downloadAnalyticsReport 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// 1. Dashboard Graphs
router.get('/:eventId', protect, getEventAnalytics);

// 2. Email PDF Report (Sponsor wala)
router.post('/report/email', protect, emailAnalyticsReport);

// 3. Download PDF Direct (Postman/Browser ke liye)
// Note: Iska method GET hai aur URL mein ID jayegi
router.get('/report/download/:eventId', protect, downloadAnalyticsReport);

module.exports = router;