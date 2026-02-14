const express = require('express');
const router = express.Router();
const { 
  getEventAnalytics, 
  emailAnalyticsReport, 
  downloadAnalyticsReport 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// ==================================================
// ANALYTICS ROUTES (Organizer Dashboard) 📊
// ==================================================

// 1. Get Stats for Charts (JSON Data)
// Usage: GET /api/analytics/stats?eventId=12345 (Specific) 
//    OR: GET /api/analytics/stats (All Events)
router.get('/stats', protect, getEventAnalytics);

// 2. Email Report (PDF)
// Usage: POST /api/analytics/send-report
// Body: { "eventId": "12345" }
router.post('/send-report', protect, emailAnalyticsReport);

// 3. Download Report (PDF Stream)
// Usage: GET /api/analytics/download-report?eventId=12345
router.get('/download-report', protect, downloadAnalyticsReport);

module.exports = router;